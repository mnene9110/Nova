
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Loader2, 
  Users, 
  Heart, 
  Trophy, 
  MessageCircle, 
  Gift, 
  Gamepad2, 
  Armchair,
  Mic,
  MicOff,
  Trash2,
  X,
  LayoutGrid,
  Send,
  ShieldCheck,
  Music as MusicIcon,
  Lock,
  Unlock,
  UserPlus,
  Ban,
  Play,
  Pause,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirebase, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { ref, onValue, off, remove, update, serverTimestamp as rtdbTimestamp, set, push, get, query, orderByChild, equalTo } from "firebase/database"
import { doc, collection, query as fsQuery, where, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { getZegoConfig } from "@/app/actions/zego"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function PartyRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { database, firestore } = useFirebase()
  const { toast } = useToast()

  const [room, setRoom] = useState<any>(null)
  const [seats, setSeats] = useState<Record<string, any>>({})
  const [messages, setMessages] = useState<any[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [mySeatIndex, setMySeatIndex] = useState<number | null>(null)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [roomUsers, setRoomUsers] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isJoinNotified, setIsJoinNotified] = useState(false)
  const [speakers, setSpeakers] = useState<Record<string, boolean>>({})
  
  // Admin Management
  const [adminSearchId, setAdminSearchId] = useState("")
  const [isAdminSearching, setIsAdminSearching] = useState(false)

  // Music State
  const [playlist, setPlaylist] = useState<any[]>([])
  const [currentTrack, setCurrentTrack] = useState<any>(null)
  const [newTrackUrl, setNewTrackUrl] = useState("")
  const [newTrackTitle, setNewTrackTitle] = useState("")

  const zpRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile } = useDoc(userProfileRef)

  const isHost = currentUser?.uid === room?.hostId
  const isAdmin = useMemo(() => room?.admins?.[currentUser?.uid || ""] === true || isHost, [room, currentUser, isHost])

  // 1. Monitor Room and Participants
  useEffect(() => {
    if (!database || !roomId || !currentUser) return
    
    const roomRef = ref(database, `partyRooms/${roomId}`)
    
    // Kick check
    onValue(ref(database, `partyRooms/${roomId}/kickedUsers/${currentUser.uid}`), (snap) => {
      if (snap.val()) {
        toast({ variant: "destructive", title: "Access Denied", description: "You have been kicked from this room." })
        router.push('/party')
      }
    })

    onValue(roomRef, (snap) => {
      const data = snap.val()
      if (data) {
        if (data.isLocked && !isHost && !data.admins?.[currentUser.uid]) {
           // If user is already inside and it locks, we might let them stay, 
           // but entry is blocked in the list page
        }
        setRoom(data)
      } else {
        toast({ title: "Room Closed", description: "The host has ended this party." })
        router.push('/party')
      }
    })

    // Listen to Seats
    onValue(ref(database, `partyRooms/${roomId}/seats`), (snap) => {
      const data = snap.val() || {}
      setSeats(data)
      const mySeat = Object.entries(data).find(([_, val]: [string, any]) => val.userId === currentUser?.uid)
      if (mySeat) setMySeatIndex(Number(mySeat[0]))
      else setMySeatIndex(null)
    })

    // Listen to Messages
    onValue(ref(database, `partyRooms/${roomId}/messages`), (snap) => {
      const data = snap.val()
      if (data) {
        const list = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }))
        list.sort((a, b) => a.timestamp - b.timestamp)
        setMessages(list.slice(-50))
      }
    })

    // Listen to Playlist
    onValue(ref(database, `partyRooms/${roomId}/playlist`), (snap) => {
      const data = snap.val()
      setPlaylist(data ? Object.values(data) : [])
    })

    // Participant Presence
    const presenceRef = ref(database, `partyRooms/${roomId}/participants/${currentUser?.uid}`)
    if (profile) {
      set(presenceRef, {
        userId: currentUser.uid,
        username: profile.username || "Guest",
        photo: profile.profilePhotoUrls?.[0] || "",
        joinedAt: Date.now()
      })

      if (!isJoinNotified) {
        const joinMsgRef = push(ref(database, `partyRooms/${roomId}/messages`))
        set(joinMsgRef, {
          text: `${profile.username} joined the party`,
          username: "System",
          isSystem: true,
          timestamp: Date.now()
        })
        setIsJoinNotified(true)
      }
    }

    onValue(ref(database, `partyRooms/${roomId}/participants`), (snap) => {
      const data = snap.val()
      if (data) setRoomUsers(Object.values(data))
    })

    return () => {
      off(roomRef)
      if (currentUser) {
        remove(presenceRef)
        if (zpRef.current) zpRef.current.destroy()
      }
    }
  }, [database, roomId, currentUser, !!profile])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 2. Initialize Zego
  useEffect(() => {
    if (!roomId || !currentUser || !profile || zpRef.current || !room) return

    const initZego = async () => {
      try {
        const config = await getZegoConfig()
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt')

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          config.appID,
          config.serverSecret!,
          roomId,
          currentUser.uid,
          profile.username || "User"
        )

        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zpRef.current = zp

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.LiveAudioRoom,
            config: {
              role: isHost ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience,
            }
          },
          showPreJoinView: false,
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showUserList: false,
          onLeaveRoom: () => router.push('/party')
        })

        // Speaker Detection
        zp.on('soundLevelUpdate', (levels: any[]) => {
          const active: Record<string, boolean> = {}
          levels.forEach(l => {
            if (l.soundLevel > 5) active[l.userID] = true
          })
          setSpeakers(active)
        })

        setIsInitializing(false)
      } catch (error: any) {
        console.error("Zego Error:", error)
        setIsInitializing(false)
      }
    }

    initZego()
  }, [roomId, currentUser, !!profile, !!room])

  const handleMountSeat = async (index: number) => {
    if (!database || !currentUser || !profile) return
    if (seats[index]) return 

    if (mySeatIndex !== null) {
      await remove(ref(database, `partyRooms/${roomId}/seats/${mySeatIndex}`))
    }

    await set(ref(database, `partyRooms/${roomId}/seats/${index}`), {
      userId: currentUser.uid,
      username: profile.username,
      photo: profile.profilePhotoUrls?.[0] || "",
      isMicOn: true
    })

    setMySeatIndex(index)
    setIsMicMuted(false)
    if (zpRef.current) zpRef.current.mutePublishStreamAudio(false)
  }

  const handleLeaveSeat = async () => {
    if (mySeatIndex === null || !database) return
    if (zpRef.current) zpRef.current.mutePublishStreamAudio(true)
    await remove(ref(database, `partyRooms/${roomId}/seats/${mySeatIndex}`))
    setMySeatIndex(null)
  }

  const toggleMic = () => {
    if (mySeatIndex === null || !zpRef.current) return
    const newState = !isMicMuted
    setIsMicMuted(newState)
    zpRef.current.mutePublishStreamAudio(newState)
    update(ref(database, `partyRooms/${roomId}/seats/${mySeatIndex}`), { isMicOn: !newState })
  }

  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentUser || !profile) return
    const msgRef = push(ref(database, `partyRooms/${roomId}/messages`))
    set(msgRef, {
      text: chatInput,
      username: profile.username,
      userId: currentUser.uid,
      timestamp: Date.now()
    })
    setChatInput("")
  }

  // MODERATION ACTIONS
  const handleAppointAdmin = async () => {
    if (!adminSearchId.trim() || !isHost) return
    setIsAdminSearching(true)
    try {
      const q = fsQuery(collection(firestore, "userProfiles"), where("numericId", "==", Number(adminSearchId)))
      const snap = await getDocs(q)
      if (snap.empty) {
        toast({ variant: "destructive", title: "User not found" })
      } else {
        const target = snap.docs[0].data()
        await update(ref(database, `partyRooms/${roomId}/admins`), { [target.id]: true })
        toast({ title: "Admin Appointed", description: `${target.username} is now a room admin.` })
        setAdminSearchId("")
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Search Failed" })
    } finally {
      setIsAdminSearching(false)
    }
  }

  const handleKick = async (targetId: string) => {
    if (!isAdmin || targetId === room?.hostId) return
    await update(ref(database, `partyRooms/${roomId}/kickedUsers`), { [targetId]: true })
    await remove(ref(database, `partyRooms/${roomId}/participants/${targetId}`))
    // Also remove from seat if they were on one
    const seatToClear = Object.entries(seats).find(([_, s]: any) => s.userId === targetId)
    if (seatToClear) {
      await remove(ref(database, `partyRooms/${roomId}/seats/${seatToClear[0]}`))
    }
    toast({ title: "User Kicked" })
  }

  const toggleLock = async () => {
    if (!isAdmin) return
    await update(ref(database, `partyRooms/${roomId}`), { isLocked: !room?.isLocked })
  }

  const handleAddMusic = async () => {
    if (!isAdmin || !newTrackUrl.trim()) return
    const musicRef = push(ref(database, `partyRooms/${roomId}/playlist`))
    await set(musicRef, {
      id: musicRef.key,
      title: newTrackTitle || "Unknown Track",
      url: newTrackUrl,
      addedBy: profile?.username
    })
    setNewTrackUrl("")
    setNewTrackTitle("")
  }

  const sortedParticipants = useMemo(() => {
    return [...roomUsers].sort((a, b) => {
      if (a.userId === room?.hostId) return -1
      if (b.userId === room?.hostId) return 1
      const aIsAdmin = room?.admins?.[a.userId]
      const bIsAdmin = room?.admins?.[b.userId]
      if (aIsAdmin && !bIsAdmin) return -1
      if (!aIsAdmin && bIsAdmin) return 1
      return 0
    })
  }, [roomUsers, room])

  return (
    <div className="flex flex-col h-svh bg-[#0a1a1a] text-white overflow-hidden relative font-body">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a1a] via-[#1a3a3a]/40 to-[#0a1a1a] z-10" />
        <img 
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80" 
          className="w-full h-full object-cover opacity-40 blur-[2px]" 
          alt="Aurora"
        />
      </div>

      {/* Header */}
      <header className="relative z-20 px-4 py-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-white/20">
            <AvatarImage src={room?.hostPhoto} className="object-cover" />
            <AvatarFallback>{room?.hostName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black truncate max-w-[100px]">{room?.title}</h1>
              {room?.isLocked && <Lock className="w-3 h-3 text-amber-400" />}
            </div>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">ID: {roomId.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 rounded-full border border-white/10 active:scale-95 transition-all">
                <Users className="w-3.5 h-3.5 text-white/60" />
                <span className="text-[10px] font-black">{roomUsers.length}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-900 border-none text-white p-0 w-80">
              <SheetHeader className="p-6 border-b border-white/5">
                <SheetTitle className="text-white font-black text-sm uppercase tracking-widest">Participants</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col overflow-y-auto p-4 gap-3">
                {sortedParticipants.map(u => (
                  <div key={u.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={u.photo} className="object-cover" />
                        <AvatarFallback>{u.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{u.username}</span>
                        {u.userId === room?.hostId ? (
                          <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Room Host</span>
                        ) : room?.admins?.[u.userId] ? (
                          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Room Admin</span>
                        ) : null}
                      </div>
                    </div>
                    {isAdmin && u.userId !== room?.hostId && u.userId !== currentUser?.uid && (
                      <Button variant="ghost" size="icon" onClick={() => handleKick(u.userId)} className="text-red-400 hover:bg-red-500/20">
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {isHost && (
                <div className="absolute bottom-0 inset-x-0 p-6 bg-zinc-950 border-t border-white/5 space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Manage Roles</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="User Numeric ID" 
                      value={adminSearchId}
                      onChange={(e) => setAdminSearchId(e.target.value)}
                      className="bg-white/5 border-white/10 h-10 text-xs"
                    />
                    <Button onClick={handleAppointAdmin} disabled={isAdminSearching} className="bg-primary h-10 px-4">
                      {isAdminSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2.5rem] bg-zinc-900 border-none text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-headline font-black text-2xl text-center">Leave Room?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400 text-center">Are you sure you want to disconnect?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col gap-2 mt-6">
                <AlertDialogAction onClick={() => router.push('/party')} className="h-14 rounded-full bg-primary font-black uppercase text-xs tracking-widest">Leave Now</AlertDialogAction>
                <AlertDialogCancel className="h-14 rounded-full bg-zinc-800 border-none font-black text-xs text-zinc-400">Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 relative z-10 flex flex-col items-center pt-8 px-4 overflow-y-auto">
        <div className="flex items-center gap-4 mb-10 px-4 py-2 bg-black/30 backdrop-blur-xl rounded-full border border-white/5">
           <Trophy className="w-4 h-4 text-amber-400" />
           <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-6 h-6 rounded-full border border-zinc-900 bg-zinc-800 overflow-hidden">
                 <img src={`https://picsum.photos/seed/${i+100}/50/50`} className="w-full h-full object-cover" />
               </div>
             ))}
           </div>
           <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Top Contributors</span>
        </div>

        {/* Seat Grid */}
        <div className="w-full max-w-sm space-y-12">
          <div className="flex justify-center relative">
            <div className="absolute -top-6 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-200 rounded-full z-20 shadow-lg">
               <span className="text-[8px] font-black text-zinc-900 uppercase">HOST</span>
            </div>
            <div 
              onClick={() => handleMountSeat(0)}
              className={cn(
                "w-24 h-24 rounded-full border-4 flex items-center justify-center relative transition-all duration-500 cursor-pointer shadow-2xl overflow-visible",
                seats[0] ? "border-amber-400 ring-4 ring-amber-400/20" : "border-white/10 bg-black/40",
                speakers[seats[0]?.userId] && "after:absolute after:inset-[-8px] after:rounded-full after:border-2 after:border-amber-400/40 after:animate-ping"
              )}
            >
              {seats[0] ? (
                <Avatar className="w-full h-full">
                  <AvatarImage src={seats[0].photo} className="object-cover" />
                  <AvatarFallback className="text-xl font-black">{seats[0].username?.[0]}</AvatarFallback>
                </Avatar>
              ) : (
                <Armchair className="w-8 h-8 opacity-40" />
              )}
              {seats[0] && <div className="absolute -bottom-2 px-3 py-0.5 bg-amber-400 rounded-full text-zinc-900 text-[8px] font-black uppercase shadow-md">{seats[0].username}</div>}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-y-10 gap-x-2">
            {Array.from({ length: room?.maxSeats || 8 }).map((_, i) => {
              const index = i + 1;
              const occupant = seats[index];
              const isSpeaking = speakers[occupant?.userId];
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div 
                    onClick={() => handleMountSeat(index)}
                    className={cn(
                      "w-14 h-14 rounded-full border-2 flex items-center justify-center relative transition-all cursor-pointer overflow-visible",
                      occupant ? "border-primary shadow-lg" : "border-white/5 bg-black/30",
                      isSpeaking && "after:absolute after:inset-[-4px] after:rounded-full after:border-2 after:border-primary/60 after:animate-ping"
                    )}
                  >
                    {occupant ? (
                      <Avatar className="w-full h-full">
                        <AvatarImage src={occupant.photo} className="object-cover" />
                        <AvatarFallback className="text-xs font-black">{occupant.username?.[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 opacity-20">
                        <Armchair className="w-4 h-4" />
                        <span className="text-[7px] font-black">{index}</span>
                      </div>
                    )}
                    {occupant?.isMicOn && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#0a1a1a] shadow-sm">
                        <Mic className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-tighter truncate w-full text-center px-1", occupant ? "text-white" : "text-white/20")}>
                    {occupant ? occupant.username : "Mount"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-full mt-12 mb-24 flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-1.5">
              {!m.isSystem && (
                <div className="flex items-center gap-2">
                  {room?.admins?.[m.userId] && <div className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded-md"><span className="text-[8px] font-black text-blue-300 uppercase tracking-widest italic">ADMIN</span></div>}
                  <span className="text-[10px] font-black text-white/60">{m.username}</span>
                </div>
              )}
              <div className={cn("self-start max-w-[90%] backdrop-blur-xl rounded-2xl rounded-tl-none px-4 py-3 shadow-lg border", m.isSystem ? "bg-white/5 border-white/5" : "bg-black/40 border-white/10")}>
                <p className={cn("text-[13px] font-medium leading-snug", m.isSystem ? "text-white/40 italic text-xs" : "text-white/90")}>{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} className="h-4" />
        </div>
      </main>

      {/* Interaction Footer */}
      <footer className="relative z-30 px-4 py-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between gap-3">
        <div className="flex-1 relative flex items-center">
          <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type here..." className="h-12 w-full rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white pl-6 pr-12 text-sm" />
          <button onClick={handleSendMessage} className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center active:scale-90"><Send className="w-4 h-4 text-white" /></button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => router.push('/games')} className="w-12 h-12 rounded-full bg-[#9b4de0] shadow-lg flex items-center justify-center active:scale-90"><Gamepad2 className="w-6 h-6 text-white" /></button>
          
          <Sheet>
            <SheetTrigger asChild>
              <button className="w-12 h-12 rounded-full bg-[#fcd34d] shadow-lg flex items-center justify-center active:scale-90"><Gift className="w-6 h-6 text-zinc-900" /></button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-zinc-900 border-none text-white rounded-t-[3rem] h-[60svh]">
              <SheetHeader className="p-6"><SheetTitle className="text-white font-black text-lg uppercase text-center">Send Gift to</SheetTitle></SheetHeader>
              <div className="grid grid-cols-4 gap-4 p-6 overflow-y-auto">
                {Object.values(seats).map((s: any) => (
                  <div key={s.userId} className="flex flex-col items-center gap-2">
                    <Avatar className="w-16 h-16 border-2 border-primary shadow-xl"><AvatarImage src={s.photo} className="object-cover" /><AvatarFallback>{s.username?.[0]}</AvatarFallback></Avatar>
                    <span className="text-[10px] font-black uppercase text-white/60 truncate w-full text-center">{s.username}</span>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Moderator Tools */}
          {isAdmin && (
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-12 h-12 rounded-full bg-blue-600 shadow-lg flex items-center justify-center active:scale-90"><LayoutGrid className="w-6 h-6 text-white" /></button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-900 border-none text-white rounded-t-[3rem] p-8 h-[50svh]">
                <SheetHeader><SheetTitle className="text-white font-black uppercase">Moderator Panel</SheetTitle></SheetHeader>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button onClick={toggleLock} className={cn("h-20 rounded-[2rem] flex flex-col gap-2", room?.isLocked ? "bg-amber-500" : "bg-zinc-800")}>
                    {room?.isLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    <span className="text-[10px] font-black">{room?.isLocked ? "Unlock Room" : "Lock Room"}</span>
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="h-20 rounded-[2rem] bg-zinc-800 flex flex-col gap-2">
                        <MusicIcon className="w-6 h-6" />
                        <span className="text-[10px] font-black">Music Library</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="bg-zinc-950 border-none text-white rounded-t-[3rem] h-[75svh] p-0 flex flex-col">
                      <SheetHeader className="p-8"><SheetTitle className="text-white font-black">Playlist</SheetTitle></SheetHeader>
                      <div className="flex-1 overflow-y-auto px-8 space-y-4">
                        {playlist.map((track) => (
                          <div key={track.id} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{track.title}</span>
                              <span className="text-[10px] text-white/40 uppercase">Added by {track.addedBy}</span>
                            </div>
                            <Button size="icon" className="rounded-full bg-primary"><Play className="w-4 h-4" /></Button>
                          </div>
                        ))}
                      </div>
                      <div className="p-8 bg-zinc-900 space-y-3">
                        <Input placeholder="Track Title" value={newTrackTitle} onChange={e => setNewTrackTitle(e.target.value)} className="bg-white/5 border-white/10" />
                        <Input placeholder="Music URL (mp3/stream)" value={newTrackUrl} onChange={e => setNewTrackUrl(e.target.value)} className="bg-white/5 border-white/10" />
                        <Button onClick={handleAddMusic} className="w-full bg-primary rounded-full h-12 font-black uppercase text-xs">Add to Playlist</Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          {mySeatIndex !== null && (
            <button onClick={toggleMic} className={cn("w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-90", isMicMuted ? "bg-red-500" : "bg-primary")}>
              {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          )}

          <button onClick={mySeatIndex !== null ? handleLeaveSeat : () => handleMountSeat(1)} className={cn("w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-90", mySeatIndex !== null ? "bg-red-500/20 border border-red-500/40" : "bg-white/10 border border-white/10")}>
            {mySeatIndex !== null ? <X className="w-6 h-6 text-red-500" /> : <Armchair className="w-6 h-6 text-white/60" />}
          </button>
        </div>
      </footer>

      <div ref={containerRef} className="hidden" />
    </div>
  )
}
