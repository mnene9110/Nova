
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Users, 
  Music, 
  Gem, 
  Trophy, 
  ArrowRight, 
  Settings, 
  ShieldCheck,
  Plus,
  Loader2,
  Mic,
  MessageCircle,
  Eye,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase, useFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function HostCenterPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore, database } = useFirebase()

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile, isLoading } = useDoc(userProfileRef)

  const [activeRooms, setActiveRooms] = useState<any[]>([])
  const [isRoomsLoading, setIsRoomsLoading] = useState(true)

  useEffect(() => {
    if (!database || !currentUser) return

    const roomsRef = ref(database, 'partyRooms')
    return onValue(roomsRef, (snap) => {
      const data = snap.val()
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .filter(r => r.hostId === currentUser.uid && r.status === 'active')
        setActiveRooms(list)
      }
      setIsRoomsLoading(false)
    })
  }, [database, currentUser])

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-[#B36666]"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>

  if (!profile?.isPartyAdmin) {
    return <div className="flex h-svh items-center justify-center bg-white text-zinc-400 font-black uppercase text-xs tracking-widest">Access Denied</div>
  }

  const darkMaroon = "bg-[#5A1010]";

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900 overflow-y-auto scroll-smooth pb-32">
      <header className="px-4 py-8 flex items-center sticky top-0 bg-transparent z-50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/profile')} 
          className="text-white h-10 w-10 bg-black/10 backdrop-blur-md rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-black font-headline ml-4 tracking-widest uppercase text-white drop-shadow-md">Host Center</h1>
      </header>

      <main className="px-6 space-y-8 pt-4">
        {/* Host Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/10">
              <Gem className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[20px] font-black font-headline">{(profile?.diamondBalance || 0).toLocaleString()}</p>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Room Earnings</p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-5"><Gem className="w-20 h-20" /></div>
          </div>

          <div className="bg-zinc-900 rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[20px] font-black font-headline">LVL 1</p>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Host Tier</p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-5"><Trophy className="w-20 h-20" /></div>
          </div>
        </section>

        {/* My Rooms */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-primary/40" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Your Rooms</h2>
            </div>
            <Button 
              onClick={() => router.push('/party/create')}
              className="h-8 px-4 rounded-full bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest gap-2"
            >
              <Plus className="w-3 h-3" />
              New Room
            </Button>
          </div>

          {isRoomsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
          ) : activeRooms.length > 0 ? (
            <div className="space-y-3">
              {activeRooms.map(room => (
                <div 
                  key={room.id}
                  onClick={() => router.push(`/party/${room.id}`)}
                  className="bg-white/60 backdrop-blur-xl border border-white p-5 rounded-[2.25rem] flex items-center justify-between shadow-sm group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                      <AvatarImage src={room.coverPhoto || room.hostPhoto} className="object-cover" />
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h3 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{room.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          <Users className="w-2.5 h-2.5" />
                          {room.memberCount || 0} Online
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          <Eye className="w-2.5 h-2.5" />
                          {(room.memberCount || 0) * 12} Views
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white/20 rounded-[2.5rem] border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/40 rounded-[2rem] flex items-center justify-center"><Music className="w-8 h-8 text-gray-200" /></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">You haven't created any rooms yet</p>
            </div>
          )}
        </section>

        {/* Tools Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Settings className="w-4 h-4 text-primary/40" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Host Toolkit</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Mic, label: "Voice Setup", desc: "Manage Bitrate" },
              { icon: MessageCircle, label: "Chat Filter", desc: "Blocked Words" },
              { icon: ShieldCheck, label: "Moderators", desc: "Manage Admins" },
              { icon: LayoutDashboard, label: "Analytics", desc: "Room Traffic" }
            ].map((tool, i) => (
              <button key={i} className="p-6 bg-white/40 backdrop-blur-md border border-white/40 rounded-[2rem] flex flex-col gap-3 items-start shadow-sm active:scale-95 transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <tool.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{tool.label}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
