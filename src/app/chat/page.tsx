"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, CheckCircle, Loader2, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useFirebase, useUser } from "@/firebase"
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

function ChatSessionItem({ session, onLongPress }: { session: any, onLongPress: (id: string) => void }) {
  const { firestore } = useFirebase()
  const { user: currentUser } = useUser()
  const router = useRouter()
  
  const otherUserId = session.participants.find((p: string) => p !== currentUser?.uid)
  const [otherUserData, setOtherUserData] = useState<any>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressedRef = useRef(false)

  useEffect(() => {
    if (!firestore || !otherUserId) return
    const userRef = doc(firestore, "userProfiles", otherUserId)
    return onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setOtherUserData(snap.data())
      } else {
        setOtherUserData({ username: "User logged out", profilePhotoUrls: [] })
      }
    })
  }, [firestore, otherUserId])

  const handleTouchStart = () => {
    longPressedRef.current = false
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress(session.id)
    }, 600)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  const handleItemClick = () => {
    if (!longPressedRef.current && otherUserId) {
      router.push(`/chat/${otherUserId}`)
    }
  }

  const name = otherUserData?.isSupport ? "Customer Support" : (otherUserData?.username || "User")
  const image = (otherUserData?.profilePhotoUrls && otherUserData.profilePhotoUrls[0]) || ""
  const isVerified = !!otherUserData?.isVerified
  const isOnline = !!otherUserData?.isOnline
  const unreadCount = session[`unreadCount_${currentUser?.uid}`] || 0

  return (
    <div
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      className="relative select-none px-4"
    >
      <div 
        onClick={handleItemClick}
        className="flex items-center gap-4 py-4 px-2 transition-all cursor-pointer"
      >
        <div className="relative shrink-0">
          <Avatar className="w-14 h-14 border border-white/20 shadow-sm bg-gray-50">
            {image && <AvatarImage src={image} className="object-cover" />}
            <AvatarFallback className="bg-transparent text-gray-400">
              {name ? name[0] : ''}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <h3 className={cn(
                "font-black text-[15px] truncate font-headline tracking-tight",
                name === "User logged out" ? "text-gray-400 font-medium italic" : "text-[#EB4C4C]"
              )}>
                {name}
              </h3>
              {isVerified && <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" />}
            </div>
            {session.timestamp && (
              <span className="text-[10px] font-bold text-gray-400 tracking-tighter">
                {session.timestamp.toDate?.() ? session.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className={cn("text-[12px] truncate font-medium flex-1 tracking-tight", unreadCount > 0 ? "text-gray-900 font-black" : "text-gray-500")}>
              {session.lastMessage || "Start a conversation"}
            </p>
            {unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#EB4C4C] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatListPage() {
  const { firestore } = useFirebase()
  const { user: currentUser } = useUser()
  const [sessions, setSessions] = useState<any[]>([])
  const [hasFetched, setHasFetched] = useState(false)
  const [hidingTarget, setHidingTarget] = useState<string | null>(null)
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    if (!firestore || !currentUser) return
    
    const chatsQuery = query(
      collection(firestore, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("timestamp", "desc")
    )
    
    return onSnapshot(chatsQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      const filtered = list.filter((s: any) => {
        const isHidden = s[`hidden_${currentUser.uid}`] === true
        const hasSent = s[`userHasSent_${currentUser.uid}`] === true
        const unread = s[`unreadCount_${currentUser.uid}`] > 0
        return !isHidden && (hasSent || unread)
      })
      setSessions(filtered)
      setHasFetched(true)
    }, (error) => {
      console.error("Chat list snapshot error:", error)
    })
  }, [firestore, currentUser])

  const handleHideChat = async () => {
    if (!currentUser || !hidingTarget || !firestore) return
    setIsHiding(true)
    try {
      const chatRef = doc(firestore, "chats", hidingTarget)
      await updateDoc(chatRef, { 
        [`hidden_${currentUser.uid}`]: true,
        [`unreadCount_${currentUser.uid}`]: 0 
      })
      setHidingTarget(null)
    } catch (e) {
      console.error("Failed to delete chat", e)
    } finally {
      setIsHiding(false)
    }
  }

  return (
    <div className="flex flex-col min-h-svh pb-20 bg-white overflow-hidden">
      <header className="px-6 pt-8 pb-4 shrink-0 flex items-center justify-between bg-[#EB4C4C]">
        <h1 className="text-3xl font-logo text-white drop-shadow-md">Chats</h1>
        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-smooth pt-2">
        {sessions.length > 0 ? (
          <div className="flex flex-col gap-1 pb-32">
            {sessions.map((session) => (
              <ChatSessionItem 
                key={session.id} 
                session={session} 
                onLongPress={setHidingTarget} 
              />
            ))}
            <div className="py-8 flex justify-center opacity-30">
               <p className="text-[10px] font-black text-[#EB4C4C] uppercase tracking-[0.3em]">Encrypted Conversations</p>
            </div>
          </div>
        ) : hasFetched ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#EB4C4C]/30 gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100 shadow-inner">
              <MessageSquare className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Active Chats</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-3 opacity-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#EB4C4C]" />
          </div>
        )}
      </main>

      <Dialog open={!!hidingTarget} onOpenChange={(open) => !open && setHidingTarget(null)}>
        <DialogContent className="rounded-[2.5rem] bg-white border-none p-8 max-w-[85%] mx-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-headline text-gray-900 text-center">Delete Conversation</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <p className="text-sm text-gray-500 font-medium text-center mb-2 leading-relaxed">
              Are you sure you want to remove this conversation?
            </p>
            <Button 
              onClick={handleHideChat}
              disabled={isHiding}
              className="h-14 rounded-full bg-red-500 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl active:scale-95 transition-all"
            >
              {isHiding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setHidingTarget(null)}
              className="h-14 rounded-full text-gray-400 font-black uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
