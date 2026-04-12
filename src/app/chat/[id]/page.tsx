
"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, Send, Send as SendIcon, Phone, Loader2, CheckCircle, UserX, ArrowUp, ShieldAlert, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { 
  collection, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction,
  setDoc
} from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export const GIFTS = [
  { id: 'mask', name: 'Party mask 🎭', emoji: '🎭', price: 20 },
  { id: 'handbag', name: 'Luxury Bag 👜', emoji: '👜', price: 800 },
  { id: 'tea', name: 'Strong Tea 🍵', emoji: '🍵', price: 100 },
  { id: 'duck', name: 'Cute duck 🦆', emoji: '🦆', price: 20 },
  { id: 'treasure', name: 'Treasure 💎', emoji: '💎', price: 500 },
  { id: 'puppy', name: 'Puppy 🐶', emoji: '🐶', price: 150 },
  { id: 'castle', name: 'Moon castle 🏰', emoji: '🏰', price: 800 },
  { id: 'rabbit', name: 'Rabbit 🐰', emoji: '🐰', price: 150 },
  { id: 'cat', name: 'Cat 🐱', emoji: '🐱', price: 150 },
  { id: 'balloon', name: 'Balloon 🎈', emoji: '🎈', price: 20 },
  { id: 'soulmate', name: 'Soul mate 💖', emoji: '💖', price: 30 },
  { id: 'ufo', name: 'UFO 🛸', emoji: '🛸', price: 1990 },
]

const ABUSIVE_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'idiot', 'stupid', 'bastard', 'slut', 'whore', 'pussy', 'dick'];
const RESTRICTED_FEMALE_PHRASES = ["i'm paid", "pay", "nalipwa", "earning", "i'm earning", "nipali", "lipa"];
const LINKS_REGEX = /(https?:\/\/|www\.)[^\s]+/gi;

function ChatDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const otherUserId = params?.id as string
  const initialMsg = searchParams?.get('msg')
  
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const router = useRouter()
  const { toast } = useToast()
  
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const [inputText, setInputText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  
  const [msgLimit, setMsgLimit] = useState(30)
  const [hasMore, setHasMore] = useState(true)

  const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false)
  const [selectedGift, setSelectedGift] = useState<typeof GIFTS[0] | null>(null)
  const [isSendingGift, setIsSendingGift] = useState(false)

  const chatId = useMemo(() => {
    if (!currentUser || !otherUserId) return ""
    return [currentUser.uid, otherUserId].sort().join("_")
  }, [currentUser?.uid, otherUserId])

  const otherUserRef = useMemoFirebase(() => otherUserId ? doc(firestore, "userProfiles", otherUserId) : null, [firestore, otherUserId])
  const { data: otherUser, isLoading: isOtherUserLoading } = useDoc(otherUserRef)

  const meRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser?.uid])
  const { data: currentUserProfile } = useDoc(meRef)

  const chatRef = useMemoFirebase(() => chatId ? doc(firestore, "chats", chatId) : null, [firestore, chatId])
  const { data: chatData } = useDoc(chatRef)

  const isBlocked = chatData?.blockedBy && chatData.blockedBy.length > 0;

  useEffect(() => {
    if (!firestore || !chatId) return
    const msgQuery = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("sentAt", "desc"),
      limit(msgLimit)
    )

    return onSnapshot(msgQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a: any, b: any) => (a.sentAt?.seconds || 0) - (b.sentAt?.seconds || 0))
      setMessages(list)
      setHasMore(snapshot.docs.length >= msgLimit)
    })
  }, [firestore, chatId, msgLimit])

  useEffect(() => {
    if (initialMsg && currentUser && otherUserId && otherUser && !isSending && !isBlocked) {
      const timer = setTimeout(() => {
        handleSendMessage(initialMsg);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialMsg, !!currentUser, otherUserId, !!otherUser, isBlocked]);

  useEffect(() => {
    if (!firestore || !currentUser || !chatId) return
    const chatRef = doc(firestore, "chats", chatId)
    updateDoc(chatRef, { [`unreadCount_${currentUser.uid}`]: 0 }).catch(() => {})
  }, [firestore, currentUser, chatId, messages.length])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const validateAndFilterText = (text: string): { processedText: string; isViolating: boolean; warning?: string } => {
    const isSenderPrivileged = !!(currentUserProfile?.isAdmin || currentUserProfile?.isSupport || currentUserProfile?.isCoinseller || currentUserProfile?.isAgent);
    const isReceiverPrivileged = !!(otherUser?.isAdmin || otherUser?.isSupport || otherUser?.isCoinseller || otherUser?.isAgent);

    if (isSenderPrivileged || isReceiverPrivileged) {
      return { processedText: text, isViolating: false };
    }

    let lowerText = text.toLowerCase();
    const isFemale = currentUserProfile?.gender?.toLowerCase() === 'female';

    if (LINKS_REGEX.test(text)) {
      return { processedText: text, isViolating: true, warning: "Sending links is not allowed." };
    }

    const hasAbuse = ABUSIVE_WORDS.some(word => lowerText.includes(word));
    if (hasAbuse) {
      return { processedText: text, isViolating: true, warning: "Your message contains offensive language." };
    }

    if (isFemale) {
      const hasRestrictedPhrase = RESTRICTED_FEMALE_PHRASES.some(phrase => lowerText.includes(phrase));
      if (hasRestrictedPhrase) {
        return { 
          processedText: text, 
          isViolating: true, 
          warning: "You are violating app policy which may lead to your account suspension." 
        };
      }
    }

    return { processedText: text, isViolating: false };
  }

  const handleInitiateCall = async (type: 'video' | 'audio') => {
    if (!firestore || !chatId || !currentUser || !currentUserProfile || !otherUser || isBlocked) return

    if (otherUser.inCall) {
      toast({ variant: "destructive", title: "User Busy", description: "This user is currently on another call." });
      return;
    }

    const costPerMin = type === 'video' ? 160 : 80;
    const userCoins = currentUserProfile.coinBalance || 0;
    const isFree = currentUserProfile.isAdmin || currentUserProfile.isSupport || currentUserProfile.isCoinseller || otherUser.isSupport || otherUser.isCoinseller;

    if (!isFree && userCoins < costPerMin) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need at least ${costPerMin} coins to start this call.`,
        action: <Button onClick={() => router.push('/recharge')} size="sm" className="bg-white text-primary">Recharge</Button>
      });
      return;
    }

    const callRef = doc(firestore, "calls", chatId);
    await setDoc(callRef, { 
      callerId: currentUser.uid, 
      receiverId: otherUserId, 
      status: 'ringing', 
      callType: type, 
      timestamp: Date.now(),
      callerName: currentUserProfile.username || 'Someone',
      costPerMin: costPerMin,
      isFree: isFree
    });

    await updateDoc(doc(firestore, "userProfiles", otherUserId), { incomingCallId: chatId });
    await updateDoc(doc(firestore, "userProfiles", currentUser.uid), { incomingCallId: chatId });
  }

  const handleSendMessage = async (textOverride?: string) => {
    const rawText = textOverride || inputText;
    if (!rawText.trim() || !currentUser || !chatId || !firestore || !otherUserId || !otherUser || isSending || !currentUserProfile || isBlocked) return
    
    const { processedText, isViolating, warning } = validateAndFilterText(rawText);
    
    if (isViolating) {
      toast({ variant: "destructive", title: "Message Blocked", description: warning });
      return;
    }

    const isFree = currentUserProfile.isAdmin || 
                   currentUserProfile.isSupport || 
                   currentUserProfile.isCoinseller || 
                   otherUser.isSupport || 
                   otherUser.isCoinseller || 
                   currentUserProfile.gender?.toLowerCase() === 'female';

    const messageCost = isFree ? 0 : 15;
    
    setIsSending(true)
    try {
      await runTransaction(firestore, async (transaction) => {
        if (messageCost > 0) {
          const myProfileSnap = await transaction.get(meRef!);
          const myBalance = myProfileSnap.data()?.coinBalance || 0;
          if (myBalance < messageCost) throw new Error("INSUFFICIENT_COINS");
          
          transaction.update(meRef!, { coinBalance: increment(-messageCost) });
          
          const logRef = doc(collection(firestore, "userProfiles", currentUser.uid, "transactions"));
          transaction.set(logRef, {
            id: logRef.id,
            type: "deduction",
            amount: -messageCost,
            transactionDate: new Date().toISOString(),
            description: `Message to ${otherUser.username}`
          });
        }

        const msgRef = doc(collection(firestore, "chats", chatId, "messages"));
        transaction.set(msgRef, {
          messageText: processedText,
          senderId: currentUser.uid,
          sentAt: serverTimestamp(),
          status: 'sent'
        });

        const chatMetaRef = doc(firestore, "chats", chatId);
        transaction.set(chatMetaRef, {
          lastMessage: processedText,
          timestamp: serverTimestamp(),
          participants: [currentUser.uid, otherUserId],
          [`unreadCount_${otherUserId}`]: increment(1),
          [`userHasSent_${currentUser.uid}`]: true
        }, { merge: true });
      });

      if (!textOverride) setInputText("")
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_COINS") {
        toast({ variant: "destructive", title: "Insufficient Coins", description: "Recharge to continue chatting.", action: <Button onClick={() => router.push('/recharge')} size="sm" className="bg-white text-primary">Recharge</Button> });
      } else {
        toast({ variant: "destructive", title: "Send Failed", description: "Check your connection." });
      }
    } finally { setIsSending(false) }
  }

  const handleSendGift = async (giftOverride?: typeof GIFTS[0]) => {
    const gift = giftOverride || selectedGift;
    if (!gift || !currentUser || !otherUserId || isSendingGift || !currentUserProfile || !firestore || !otherUser || isBlocked) return;
    
    setIsSendingGift(true);
    const giftPrice = gift.price;
    const diamondGain = Math.floor(giftPrice * 0.6);

    try {
      await runTransaction(firestore, async (transaction) => {
        const myProfileSnap = await transaction.get(meRef!);
        const myBalance = myProfileSnap.data()?.coinBalance || 0;
        if (myBalance < giftPrice) throw new Error("INSUFFICIENT_COINS");

        transaction.update(meRef!, { coinBalance: increment(-giftPrice) });
        transaction.update(otherUserRef!, { diamondBalance: increment(diamondGain) });

        const giftMessage = `🎁 Sent a gift: ${gift.name}`;
        const msgRef = doc(collection(firestore, "chats", chatId, "messages"));
        transaction.set(msgRef, { messageText: giftMessage, senderId: currentUser.uid, sentAt: serverTimestamp(), isGift: true, giftId: gift.id, status: 'sent' });

        const chatMetaRef = doc(firestore, "chats", chatId);
        transaction.set(chatMetaRef, {
          lastMessage: giftMessage,
          timestamp: serverTimestamp(),
          participants: [currentUser.uid, otherUserId],
          [`unreadCount_${otherUserId}`]: increment(1),
          [`userHasSent_${currentUser.uid}`]: true
        }, { merge: true });
      });

      toast({ title: "Gift Sent!", description: `You sent a ${gift.name}.` });
      setIsGiftSheetOpen(false);
      setSelectedGift(null);
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_COINS") {
        toast({ variant: "destructive", title: "Insufficient Coins", description: "Please recharge to send this gift." });
      } else {
        toast({ variant: "destructive", title: "Gift Failed", description: "Could not deliver gift." });
      }
    } finally { setIsSendingGift(false) }
  }

  if (isOtherUserLoading) {
    return <div className="flex h-svh items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-white p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100">
          <UserX className="w-12 h-12 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black font-headline text-gray-900 tracking-tight">User logged out</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[240px] mx-auto">This account no longer exists.</p>
        </div>
        <Button onClick={() => router.back()} className="h-14 w-full max-w-[200px] rounded-full bg-primary font-black uppercase text-xs tracking-widest shadow-xl">Go Back</Button>
      </div>
    )
  }

  const otherUserImage = (otherUser.profilePhotoUrls && otherUser.profilePhotoUrls[0]) || `https://picsum.photos/seed/${otherUserId}/200/200`
  const otherUserName = otherUser.isSupport ? "Customer Support" : (otherUser.username || "User")
  const presenceText = otherUser.isOnline ? "Online" : "Offline"

  return (
    <div className="flex flex-col h-svh bg-white relative overflow-hidden text-gray-900">
      <header className="px-5 pt-6 pb-3 bg-[#111FA2] flex items-center justify-between sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9 rounded-full bg-white/20 text-white"><ChevronLeft className="w-5 h-5" /></Button>
        <div className={cn("flex items-center gap-3 transition-opacity flex-1 justify-center", otherUser.isSupport ? "cursor-default" : "cursor-pointer active:opacity-70")} onClick={() => !otherUser.isSupport && router.push(`/profile/${otherUserId}`)}>
          <Avatar className="w-8 h-8 border border-white/40 shadow-sm"><AvatarImage src={otherUserImage} className="object-cover" /><AvatarFallback>{otherUserName[0] || '?'}</AvatarFallback></Avatar>
          <div className="flex flex-col text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <h3 className="font-bold text-[12px] leading-none text-white drop-shadow-sm">{otherUserName}</h3>
              {otherUser.isVerified && <CheckCircle className="w-2.5 h-2.5 text-blue-400 fill-blue-400/10" />}
            </div>
            <span className={cn("text-[8px] font-black uppercase tracking-widest", otherUser.isOnline ? "text-green-400" : "text-white/40")}>{presenceText}</span>
          </div>
        </div>
        <div className="w-9" />
      </header>

      <ScrollArea className="flex-1 px-4 py-4 bg-transparent relative">
        <div className="flex flex-col gap-4">
          {hasMore && (
            <button onClick={() => setMsgLimit(prev => prev + 30)} className="py-4 flex flex-col items-center gap-1 group active:opacity-50 transition-all">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"><ArrowUp className="w-4 h-4" /></div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Load Earlier</span>
            </button>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid
            const isCallLog = msg.isCallLog === true
            const isGift = msg.isGift === true
            const statusText = msg.status === 'seen' ? 'Seen' : 'Sent'
            
            return (
              <div key={msg.id} className="flex w-full flex-col">
                <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 text-[13px] font-medium leading-relaxed shadow-sm transition-all", 
                    isMe ? "bg-primary text-white rounded-[1.5rem] rounded-tr-none" : "bg-gray-100 text-gray-900 rounded-[1.5rem] rounded-tl-none border border-gray-200",
                    isGift && "bg-white border-none p-0 overflow-hidden rounded-2xl shadow-md min-w-[180px]",
                    isCallLog && "bg-transparent shadow-none border-none py-1 px-2 font-black text-[10px] tracking-widest text-[#111FA2]/30 uppercase"
                  )}>
                    {isGift ? (
                      <div className="flex flex-col">
                        <div className="p-6 flex flex-col items-center justify-center bg-gray-50/50 relative">
                          <div className="text-5xl mb-2 drop-shadow-sm">{GIFTS.find(g => g.id === msg.giftId)?.emoji || '🎁'}</div>
                          <div className="absolute bottom-4 right-4 italic font-black text-sky-500 text-2xl">x 1</div>
                        </div>
                        {isMe && !isBlocked && (
                          <button 
                            onClick={() => {
                              const gift = GIFTS.find(g => g.id === msg.giftId);
                              if (gift) handleSendGift(gift);
                            }}
                            disabled={isSendingGift}
                            className="w-full h-12 bg-[#00AEEF] hover:bg-[#009EDF] text-white font-black text-sm uppercase tracking-widest transition-all active:scale-95"
                          >
                            {isSendingGift ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send one more"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.messageText}</p>
                    )}
                  </div>
                </div>
                {isMe && !isCallLog && (
                  <div className="flex justify-end pr-2 mt-1">
                    <span className="text-[8px] font-black uppercase text-[#111FA2]/20 tracking-widest">{statusText}</span>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={scrollRef} className="h-4" />
        </div>

        {isBlocked && (
          <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-black font-headline text-gray-900 mb-2">Chat Restricted</h3>
            <p className="text-sm text-gray-500 font-medium">You have been blocked or have blocked this user.</p>
          </div>
        )}
      </ScrollArea>

      <footer className={cn("px-5 py-5 pb-8 space-y-4 bg-white border-t border-gray-100 relative", isBlocked && "opacity-20 pointer-events-none")}>
        {currentUserProfile?.gender?.toLowerCase() === 'female' && (
          <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 mb-2">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">Maintain professional ethics to avoid suspension</span>
          </div>
        )}
        <div className="relative group">
          <Input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Message..." className="rounded-full h-12 bg-gray-50 border-none px-6 text-[13px]" onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} disabled={isBlocked} />
          <Button size="icon" className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full w-9 h-9", inputText.trim() && !isSending ? "bg-primary text-white" : "bg-gray-200 text-gray-400")} onClick={() => handleSendMessage()} disabled={!inputText.trim() || isSending || isBlocked}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
          </Button>
        </div>
        {!otherUser.isSupport && (
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleInitiateCall('audio')} disabled={isBlocked} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 h-16 rounded-2xl border border-gray-100 active:scale-95 transition-all shadow-sm">
              <div className="relative w-6 h-6"><Image src="/voice.png" alt="Voice" fill className="object-contain" /></div>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Voice</span>
            </button>
            <button onClick={() => handleInitiateCall('video')} disabled={isBlocked} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 h-16 rounded-2xl border border-gray-100 active:scale-95 transition-all shadow-sm">
              <div className="relative w-6 h-6"><Image src="/video.png" alt="Video" fill className="object-contain" /></div>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Video</span>
            </button>
            <Sheet open={isGiftSheetOpen} onOpenChange={setIsGiftSheetOpen}>
              <SheetTrigger asChild>
                <button disabled={isBlocked} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 h-16 rounded-2xl border border-gray-100 active:scale-95 transition-all shadow-sm">
                  <div className="relative w-6 h-6"><Image src="/gift.png" alt="Gift" fill className="object-contain" /></div>
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Gift</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-[3rem] h-[75svh] p-0 border-none bg-zinc-900 text-white overflow-hidden flex flex-col">
                <SheetHeader className="px-6 pt-8 pb-4 shrink-0">
                  <SheetTitle className="text-xs font-black uppercase tracking-widest text-zinc-400">Select a Gift</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-32">
                  <div className="grid grid-cols-4 gap-2">
                    {GIFTS.map((gift) => (
                      <div 
                        key={gift.id} 
                        onClick={() => setSelectedGift(gift)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all cursor-pointer",
                          selectedGift?.id === gift.id ? "bg-primary/20 border-primary shadow-lg" : "bg-transparent border-transparent"
                        )}
                      >
                        <div className="w-14 h-14 flex items-center justify-center text-4xl">{gift.emoji}</div>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[6px] font-black text-zinc-900 italic">S</div>
                            <span className="text-[10px] font-black">{gift.price}</span>
                          </div>
                          <span className="text-[8px] font-bold text-zinc-400 text-center truncate w-full">{gift.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <footer className="absolute bottom-0 left-0 right-0 p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-between z-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-2 rounded-full border border-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-black text-zinc-900 italic">S</div>
                      <span className="text-xs font-black">{(currentUserProfile?.coinBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleSendGift()} 
                    disabled={!selectedGift || isSendingGift}
                    className="h-12 px-10 rounded-full bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl"
                  >
                    {isSendingGift ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                  </Button>
                </footer>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </footer>
    </div>
  )
}

export default function ChatDetailPage() {
  return (
    <Suspense fallback={<div className="flex h-svh items-center justify-center bg-white" />}>
      <ChatDetailContent />
    </Suspense>
  )
}
