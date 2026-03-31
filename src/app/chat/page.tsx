
"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Mail, Loader2, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useFirebase, useUser, useFirestore } from "@/firebase"
import { ref, onValue } from "firebase/database"
import { doc, getDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

function ChatSessionItem({ session }: { session: any }) {
  const { firestore } = useFirebase()
  const [otherUserData, setOtherUserData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      if (!firestore || !session.otherUserId) return
      try {
        const userDoc = await getDoc(doc(firestore, "userProfiles", session.otherUserId))
        if (userDoc.exists()) {
          setOtherUserData(userDoc.data())
        }
      } catch (e) {
        console.error("Failed to fetch user in chat list", e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [firestore, session.otherUserId])

  const name = otherUserData?.username || `User ${session.otherUserId.slice(0, 4)}`
  const image = (otherUserData?.profilePhotoUrls && otherUserData.profilePhotoUrls[0]) || `https://picsum.photos/seed/${session.otherUserId}/100/100`

  return (
    <Link 
      href={`/chat/${session.otherUserId}`} 
      className="flex items-center gap-4 py-4 hover:bg-gray-50/50 rounded-2xl px-2 transition-colors group"
    >
      <div className="relative shrink-0">
        <Avatar className="w-14 h-14 border-2 border-white shadow-md">
          <AvatarImage src={image} className="object-cover" />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-bold text-sm text-gray-900 truncate font-headline">{name}</h3>
          {session.timestamp && (
            <span className="text-[10px] text-gray-400">
              {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-[13px] text-gray-500 truncate font-medium mt-0.5">
          {session.lastMessage || "Start a conversation"}
        </p>
      </div>
    </Link>
  )
}

export default function ChatListPage() {
  const { database } = useFirebase()
  const { user: currentUser } = useUser()
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database || !currentUser) return

    const userChatsRef = ref(database, `users/${currentUser.uid}/chats`)
    return onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const sessionList = Object.entries(data).map(([key, val]: [string, any]) => ({
          otherUserId: key,
          ...val
        }))
        // Sort sessions by timestamp (descending)
        sessionList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setSessions(sessionList)
      } else {
        setSessions([])
      }
      setIsLoading(false)
    })
  }, [database, currentUser])

  return (
    <div className="flex flex-col min-h-svh pb-24 bg-transparent">
      <header className="bg-transparent pt-12 pb-4 px-6 sticky top-0 z-20">
        <div className="flex items-center">
          <h1 className="text-3xl font-headline font-black text-white relative flex items-center gap-2">
            Chat
            <MessageSquare className="w-6 h-6 text-white/40" />
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full" />
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 mt-4 bg-white rounded-t-[3rem] shadow-2xl pt-6">
        <section>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {sessions.map((session) => (
                <ChatSessionItem key={session.otherUserId} session={session} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-medium gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-gray-200" />
              </div>
              <p>No active conversations yet.</p>
            </div>
          )}

          <div className="flex items-center gap-4 py-6 px-2 mt-4 border-t border-gray-50 opacity-60">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 font-headline">History</h3>
              <p className="text-xs text-gray-400 font-medium">History of old conversations</p>
            </div>
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  )
}
