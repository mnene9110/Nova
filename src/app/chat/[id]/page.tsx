
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Video, Send, Mic, Image as ImageIcon, Phone, Gift, Hash, Smile, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { generateConversationStarters } from "@/ai/flows/ai-conversation-starter"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { ref, push, onValue, serverTimestamp as rtdbTimestamp, update, child } from "firebase/database"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ChatDetailPage() {
  const { id: otherUserId } = useParams()
  const { user: currentUser } = useUser()
  const { firestore, database } = useFirebase()
  const router = useRouter()
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const [inputText, setInputText] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(["Hey! How's your day?", "Nice to meet you!", "What are your hobbies?"])
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [isOnline, setIsOnline] = useState(false)
  
  const chatId = [currentUser?.uid, otherUserId].sort().join("_")

  const otherUserRef = useMemoFirebase(() => doc(firestore, "userProfiles", otherUserId as string), [firestore, otherUserId])
  const { data: otherUser, isLoading: isOtherUserLoading } = useDoc(otherUserRef)

  // Presence Listener
  useEffect(() => {
    if (!database || !otherUserId) return
    const presenceRef = ref(database, `users/${otherUserId}/presence/online`)
    return onValue(presenceRef, (snap) => {
      setIsOnline(!!snap.val())
    })
  }, [database, otherUserId])

  // Realtime Database Messages Listener
  useEffect(() => {
    if (!database || !chatId) return
    const messagesRef = ref(database, `chats/${chatId}/messages`)
    return onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const msgList = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        }))
        setMessages(msgList)
      } else {
        setMessages([])
      }
    })
  }, [database, chatId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = (text = inputText) => {
    if (!text.trim() || !currentUser || !chatId || !database) return
    
    const messagesRef = ref(database, `chats/${chatId}/messages`)
    const newMessageKey = push(messagesRef).key

    const messageData = {
      messageText: text,
      senderId: currentUser.uid,
      sentAt: rtdbTimestamp(),
    }

    // Atomic updates across RTDB paths
    const updates: any = {}
    updates[`/chats/${chatId}/messages/${newMessageKey}`] = messageData
    updates[`/users/${currentUser.uid}/chats/${otherUserId}`] = {
      lastMessage: text,
      timestamp: rtdbTimestamp(),
      otherUserId: otherUserId,
      chatId: chatId
    }
    updates[`/users/${otherUserId}/chats/${currentUser.uid}`] = {
      lastMessage: text,
      timestamp: rtdbTimestamp(),
      otherUserId: currentUser.uid,
      chatId: chatId
    }
    
    update(ref(database), updates)
    setInputText("")
  }

  const startVideoCall = () => {
    setIsVideoActive(true)
  }

  if (isOtherUserLoading) {
    return (
      <div className="flex items-center justify-center h-svh bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-white p-6 text-center">
        <h2 className="text-2xl font-bold mb-4 font-headline">Chat Unavailable</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const otherUserImage = (otherUser.profilePhotoUrls && otherUser.profilePhotoUrls[0]) || `https://picsum.photos/seed/${otherUser.id}/100/100`

  return (
    <div className="flex flex-col h-svh bg-white relative">
      {isVideoActive && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col animate-in fade-in zoom-in duration-500">
           <div className="relative flex-1">
             <img src={otherUserImage} className="w-full h-full object-cover opacity-80" alt="Video Call" />
             <div className="absolute top-10 left-6 text-white">
                <h2 className="text-2xl font-bold font-headline">{otherUser.username}</h2>
                <p className="text-white/60">Connecting...</p>
             </div>
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6">
                <Button onClick={() => setIsVideoActive(false)} variant="destructive" className="rounded-full w-16 h-16 shadow-2xl">
                  End
                </Button>
             </div>
           </div>
        </div>
      )}

      <header className="px-4 py-3 bg-white flex items-center justify-between sticky top-0 z-10 border-b shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-0 h-auto font-bold flex items-center gap-1">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col items-start flex-1">
            <h3 className="font-bold text-base leading-none font-headline">{otherUser.username}</h3>
            <div className="flex items-center gap-1 mt-1">
               <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} />
               <span className="text-[10px] text-muted-foreground font-medium">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <Avatar className="w-8 h-8 border">
          <AvatarImage src={otherUserImage} className="object-cover" />
          <AvatarFallback>{otherUser.username?.[0]}</AvatarFallback>
        </Avatar>
      </header>

      <ScrollArea className="flex-1 bg-gray-50/30">
        <div className="px-4 py-4 space-y-6">
          {/* User Preview Card */}
          <div className="bg-[#E0F2FE] rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                 <Badge className="bg-primary hover:bg-primary text-white border-none text-[10px] px-3 py-0.5 rounded-full font-black">
                    {otherUser.gender === 'female' ? '♀' : '♂'} {otherUser.dateOfBirth ? (new Date().getFullYear() - new Date(otherUser.dateOfBirth).getFullYear()) : '20'}
                 </Badge>
                 <Badge className="bg-[#FFB13B] hover:bg-[#FFB13B] text-white border-none text-[10px] px-3 py-0.5 rounded-full font-black">
                    {otherUser.location || "Nearby"}
                 </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#FCF8B4] w-fit px-2.5 py-1 rounded-lg">
               <span className="text-[10px]">👤✅</span>
               <span className="text-[10px] font-black uppercase tracking-tighter text-black">Verified User</span>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                  <img src={`https://picsum.photos/seed/${otherUserId}-${i}/100/100`} className="w-full h-full object-cover" alt="Gallery" />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">
                Common interests: {otherUser.interests?.slice(0, 3).map(interest => `🌱${interest}`).join(' ') || '🌱MatchFlow'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid
              return (
                <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                  {!isMe && (
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
                      <AvatarImage src={otherUserImage} className="object-cover" />
                      <AvatarFallback>{otherUser.username?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    isMe 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                  )}>
                    {msg.messageText}
                  </div>
                </div>
              )
            })}
            <div ref={scrollRef} />
          </div>
        </div>
      </ScrollArea>

      <footer className="p-4 bg-white border-t space-y-4">
        {/* AI Suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {aiSuggestions.map((suggestion, idx) => (
            <Button 
              key={idx} 
              variant="outline" 
              className="rounded-full border-primary/40 text-primary text-[11px] h-8 px-4 font-bold shrink-0 hover:bg-primary/5"
              onClick={() => setInputText(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
          <Button 
            className="bg-primary hover:bg-primary/90 text-white rounded-full h-8 px-5 font-black text-xs shrink-0"
            onClick={async () => {
              setIsAiLoading(true)
              try {
                const res = await generateConversationStarters({ 
                  otherUserBio: otherUser.bio || "No bio yet", 
                  otherUserInterests: otherUser.interests || [] 
                })
                setAiSuggestions(res.suggestions)
              } catch (e) {
                console.error("AI failed", e)
              } finally {
                setIsAiLoading(false)
              }
            }}
            disabled={isAiLoading}
          >
            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Next AI Tip"}
          </Button>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full text-gray-400">
            <Mic className="w-6 h-6" />
          </Button>
          <div className="flex-1 relative flex items-center">
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="rounded-full h-11 bg-gray-50 border-none pr-10 pl-4 focus-visible:ring-primary/20"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button size="icon" variant="ghost" className="absolute right-1 text-amber-400">
               <Smile className="w-5 h-5 fill-current" />
            </Button>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="rounded-full text-primary"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
          >
            <Send className="w-6 h-6 rotate-45 fill-current" />
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center px-2 pt-2">
           <Button variant="ghost" size="icon" className="text-gray-400"><ImageIcon className="w-6 h-6" /></Button>
           <Button variant="ghost" size="icon" className="text-gray-400"><Phone className="w-6 h-6" /></Button>
           <Button variant="ghost" size="icon" className="text-amber-400"><Gift className="w-6 h-6 fill-current" /></Button>
           <Button variant="ghost" size="icon" className="text-gray-400" onClick={startVideoCall}><Video className="w-6 h-6" /></Button>
           <div className="relative">
              <Button variant="ghost" size="icon" className="text-gray-400"><Hash className="w-6 h-6" /></Button>
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[7px] font-black px-1 rounded-full">New</span>
           </div>
        </div>
      </footer>
    </div>
  )
}
