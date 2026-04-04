
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  LogOut, 
  Loader2, 
  Users, 
  Crown, 
  Send, 
  Smile, 
  Gift, 
  LayoutGrid,
  Trash2,
  CheckCircle,
  X,
  MessageSquare,
  Heart,
  Gamepad2,
  Trophy,
  MoreVertical,
  Maximize2,
  Briefcase,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { ref, onValue, update, runTransaction as runRtdbTransaction, off, remove, set, onDisconnect } from "firebase/database"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getZegoConfig } from "@/app/actions/zego"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

let ZegoExpressEngine: any = null;

export default function PartyRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { database, firestore } = useFirebase()
  const { toast } = useToast()

  const [room, setRoom] = useState<any>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isMicOn, setIsMicOn] = useState(false)
  const [engineLoaded, setEngineLoaded] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [seats, setSeats] = useState<Record<string, any>>({})
  const [mySeatIndex, setMySeatIndex] = useState<number | null>(null)
  
  const [messages] = useState<any[]>([
    { id: 'sys-1', sender: 'System', text: 'Welcome to MatchFlow! Please respect others and chat politely. Let\'s have fun together!', type: 'system' },
  ])

  const zegoEngineRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const hasIncrementedRef = useRef(false)
  const roomLoadedRef = useRef(false)
  const initStartedRef = useRef(false)

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile } = useDoc(userProfileRef)

  useEffect(() => {
    if (!database || !roomId) return
    const roomRef = ref(database, `partyRooms/${roomId}`)
    const unsubscribe = onValue(roomRef, (snap) => {
      const data = snap.val()
      if (data) {
        setRoom(data)
        setSeats(data.seats || {})
        roomLoadedRef.current = true
      } else if (roomLoadedRef.current) {
        toast({ title: "Room Closed", description: "This party has ended." })
        router.push('/party')
      }
    })
    return () => off(roomRef, "value", unsubscribe)
  }, [database, roomId, router, toast])

  useEffect(() => {
    if (!database || !roomId) return
    const participantsRef = ref(database, `partyRooms/${roomId}/participants`)
    return onValue(participantsRef, (snap) => {
      const data = snap.val()
      if (data) setParticipants(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })))
      else setParticipants([])
    })
  }, [database, roomId])

  useEffect(() => {
    if (!currentUser) return
    const indexStr = Object.entries(seats).find(([_, seat]) => seat.userId === currentUser.uid)?.[0]
    setMySeatIndex(indexStr ? parseInt(indexStr) : null)
  }, [seats, currentUser])

  useEffect(() => {
    if (typeof window !== "undefined" && !engineLoaded) {
      import('zego-express-engine-webrtc').then((module) => {
        ZegoExpressEngine = module.ZegoExpressEngine;
        setEngineLoaded(true)
      });
    }
  }, []);

  useEffect(() => {
    if (engineLoaded && currentUser && roomId && profile && !isJoined && !initStartedRef.current && room) {
      initZego();
    }
  }, [engineLoaded, !!currentUser, roomId, isJoined, !!profile, !!room]);

  const initZego = async () => {
    if (!currentUser || !roomId || !ZegoExpressEngine || !profile || initStartedRef.current) return;
    initStartedRef.current = true;
    try {
      const config = await getZegoConfig();
      const zg = new ZegoExpressEngine(config.appID, config.server);
      zegoEngineRef.current = zg;
      zg.on('roomStreamUpdate', async (roomID: string, updateType: string, streamList: any[]) => {
        if (updateType === 'ADD') {
          streamList.forEach(stream => {
            zg.startPlayingStream(stream.streamID).then((remoteStream: MediaStream) => {
              const audio = new Audio();
              audio.srcObject = remoteStream;
              audio.play().catch(() => {});
            });
          });
        } else if (updateType === 'DELETE') {
          streamList.forEach(stream => zg.stopPlayingStream(stream.streamID));
        }
      });
      await zg.loginRoom(roomId, currentUser.uid, { userName: profile.username || 'User' }, { userUpdate: true });
      setIsJoined(true);
      setIsConnecting(false);
      if (database) {
        const myPartRef = ref(database, `partyRooms/${roomId}/participants/${currentUser.uid}`);
        set(myPartRef, { username: profile.username, photo: profile.profilePhotoUrls?.[0] || "", joinedAt: Date.now() });
        onDisconnect(myPartRef).remove();
        if (!hasIncrementedRef.current) {
          const countRef = ref(database, `partyRooms/${roomId}/memberCount`)
          runRtdbTransaction(countRef, (current) => (current || 0) + 1)
          hasIncrementedRef.current = true
        }
      }
    } catch (error: any) {
      console.error("Zego Error:", error);
      setIsConnecting(false);
      initStartedRef.current = false;
      toast({ variant: "destructive", title: "Join Failed", description: "Hardware or configuration error." });
      router.back();
    }
  }

  const handleTakeSeat = async (index: number) => {
    if (!currentUser || !profile || !isJoined || !zegoEngineRef.current || !database) return
    if (mySeatIndex !== null) return
    try {
      const zg = zegoEngineRef.current;
      const localStream = await zg.createStream({ camera: { audio: true, video: false } });
      localStreamRef.current = localStream;
      zg.startPublishingStream(`stream_${currentUser.uid}`, localStream);
      setIsMicOn(true);
      const seatRef = ref(database, `partyRooms/${roomId}/seats/${index}`);
      await set(seatRef, { userId: currentUser.uid, username: profile.username, photo: profile.profilePhotoUrls?.[0] || "" });
      onDisconnect(seatRef).remove();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Mic Permission", description: "Allow mic access to mount seat." });
    }
  }

  const handleLeaveSeat = async () => {
    if (!currentUser || !database || mySeatIndex === null || !zegoEngineRef.current) return
    try {
      const zg = zegoEngineRef.current;
      if (localStreamRef.current) {
        zg.stopPublishingStream(`stream_${currentUser.uid}`);
        zg.destroyStream(localStreamRef.current);
        localStreamRef.current = null;
      }
      setIsMicOn(false);
      await remove(ref(database, `partyRooms/${roomId}/seats/${mySeatIndex}`));
    } catch (e) {}
  }

  const updateSeatCount = async (count: number) => {
    if (!database || !roomId) return
    await update(ref(database, `partyRooms/${roomId}`), { maxSeats: count })
    toast({ title: "Capacity Updated", description: `Room capacity changed to ${count} seats.` })
  }

  const toggleMic = () => {
    if (!zegoEngineRef.current || !localStreamRef.current) return;
    const zg = zegoEngineRef.current;
    if (isMicOn) zg.mutePublishStreamAudio(localStreamRef.current, true);
    else zg.mutePublishStreamAudio(localStreamRef.current, false);
    setIsMicOn(!isMicOn);
  }

  const handleLeave = async () => {
    if (mySeatIndex !== null) await handleLeaveSeat();
    if (zegoEngineRef.current) zegoEngineRef.current.logoutRoom(roomId);
    if (database && currentUser) {
      remove(ref(database, `partyRooms/${roomId}/participants/${currentUser.uid}`));
      if (hasIncrementedRef.current) {
        const countRef = ref(database, `partyRooms/${roomId}/memberCount`)
        runRtdbTransaction(countRef, (current) => Math.max(0, (current || 1) - 1))
      }
    }
    router.push('/party');
  }

  const handleDeleteRoom = async () => {
    if (!database || !roomId || !room) return
    await remove(ref(database, `partyRooms/${roomId}`))
    router.push('/party')
  }

  if (isConnecting || !room || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase text-zinc-500 mt-4 tracking-widest">Waking Engine...</p>
      </div>
    )
  }

  const isHost = currentUser && room.hostId === currentUser.uid
  const maxSeats = room.maxSeats || 8;
  const memberSeatsArray = Array.from({ length: maxSeats }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-svh bg-zinc-950 text-white overflow-hidden relative font-body">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://picsum.photos/seed/nightlake/1080/1920" className="w-full h-full object-cover opacity-40 grayscale-[0.2]" alt="bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Header Bar */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 max-w-[60%]">
          <Avatar className="w-8 h-8 border border-white/20">
            <AvatarImage src={room.hostPhoto} className="object-cover" />
            <AvatarFallback>{room.hostName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[11px] font-black truncate">{room.title}</h1>
            <span className="text-[8px] font-bold text-white/60 uppercase">ID: {roomId.split('_').pop()}</span>
          </div>
          <Heart className="w-3.5 h-3.5 text-white/40 ml-1" />
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center active:scale-95">
                  <Settings className="w-4 h-4 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-zinc-900 border-zinc-800 text-white p-2">
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Seat Capacity</DropdownMenuLabel>
                {[4, 8, 12, 16].map(count => (
                  <DropdownMenuItem 
                    key={count} 
                    onClick={() => updateSeatCount(count)}
                    className={cn("rounded-xl font-bold text-xs py-2.5 px-4 cursor-pointer", maxSeats === count ? "bg-primary/20 text-primary" : "")}
                  >
                    {count} Seats
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl font-bold text-xs py-2.5 px-4 text-red-500 cursor-pointer">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Close Party
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[2.5rem] bg-zinc-900 border-none shadow-2xl text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-black font-headline text-center">End Party?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400 text-center">This will permanently close the room and disconnect all participants.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col gap-2">
                      <AlertDialogAction onClick={handleDeleteRoom} className="rounded-full h-14 bg-red-500 hover:bg-red-600 font-black">Close Permanently</AlertDialogAction>
                      <AlertDialogCancel className="rounded-full h-14 bg-zinc-800 border-none text-zinc-400 font-black">Cancel</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button onClick={handleLeave} className="w-8 h-8 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center active:scale-95"><Maximize2 className="w-4 h-4 text-white/60" /></button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 flex items-center justify-between z-10 mb-4">
        <div className="flex items-center gap-1">
          <Avatar className="w-6 h-6 border border-white/20">
            <AvatarImage src={room.hostPhoto} />
          </Avatar>
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center ml-1"><Trophy className="w-3 h-3 text-amber-500" /></div>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer active:opacity-70 transition-opacity">
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/5">
                <Users className="w-3 h-3 text-white/60" />
                <span className="text-[9px] font-black">{participants.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Live</span>
              </div>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[3rem] h-[60svh] bg-zinc-950 border-none p-0 flex flex-col overflow-hidden">
            <SheetHeader className="p-8 shrink-0">
              <SheetTitle className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                Participants ({participants.length})
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-8 pb-10">
              <div className="space-y-4">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border border-white/10">
                        <AvatarImage src={p.photo} className="object-cover" />
                        <AvatarFallback>{p.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{p.username}</span>
                        {p.id === room.hostId && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Room Host</span>}
                      </div>
                    </div>
                    {Object.values(seats).some(s => s.userId === p.id) && (
                      <div className="bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        <Mic className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Dynamic Seat Grid */}
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-8 pb-40">
          {/* Host Premium Seat */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
              seats['0'] ? "ring-4 ring-amber-500 ring-offset-4 ring-offset-transparent shadow-[0_0_30px_rgba(245,158,11,0.4)]" : "bg-black/40 border-2 border-white/10"
            )}>
              {seats['0'] ? (
                <Avatar className="w-full h-full"><AvatarImage src={seats['0'].photo} className="object-cover" /><AvatarFallback>{seats['0'].username?.[0]}</AvatarFallback></Avatar>
              ) : (
                <div 
                  onClick={() => isHost && handleTakeSeat(0)}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-40 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Crown className="w-5 h-5 text-white" /></div>
                </div>
              )}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 px-2 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-widest text-black shadow-lg">HOST</div>
            </div>
          </div>

          {/* Dynamic Grid */}
          <div className={cn(
            "grid gap-x-4 gap-y-10 w-full max-w-sm mx-auto",
            maxSeats <= 8 ? "grid-cols-4" : "grid-cols-4" // Maintain 4 columns for consistency, rows will expand
          )}>
            {memberSeatsArray.map((idx) => {
              const seatedUser = seats[idx.toString()];
              const isMeOnThisSeat = seatedUser && seatedUser.userId === currentUser?.uid;
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div 
                    onClick={() => !seatedUser ? handleTakeSeat(idx) : isMeOnThisSeat ? handleLeaveSeat() : null}
                    className={cn(
                      "relative cursor-pointer active:scale-95 transition-all group w-14 h-14 rounded-full flex items-center justify-center",
                      seatedUser ? "bg-white/10 ring-2 ring-white/20" : "bg-black/40 border border-white/5 border-dashed"
                    )}
                  >
                    {seatedUser ? (
                      <Avatar className="w-full h-full border border-white/10">
                        <AvatarImage src={seatedUser.photo} className="object-cover" />
                        <AvatarFallback>{seatedUser.username?.[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center justify-center opacity-20">
                        <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center mb-0.5" />
                      </div>
                    )}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black/60 px-1.5 py-0.5 rounded-full text-[6px] font-black text-white/40 border border-white/5">{idx}</div>
                    {seatedUser && <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black"><Mic className="w-2 h-2 text-white" /></div>}
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold truncate w-14 text-center uppercase tracking-tighter",
                    seatedUser ? "text-white" : "text-white/20"
                  )}>
                    {seatedUser ? seatedUser.username : 'Mount'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chat Feed */}
          <div className="space-y-3 mt-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col items-start gap-1 max-w-[90%]">
                <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[11px] font-medium text-white/80 leading-relaxed shadow-lg">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Bar */}
      <footer className="px-4 py-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-4 z-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-11 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center px-4 gap-3 active:bg-white/20">
            <span className="text-[12px] font-medium text-white/40">Say something...</span>
            <Smile className="w-5 h-5 text-white/40 ml-auto" />
          </div>

          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center active:scale-90 transition-all shadow-lg border border-white/10">
              <Gift className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={mySeatIndex !== null ? toggleMic : () => handleTakeSeat(memberSeatsArray.find(i => !seats[i.toString()]) || 1)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg border",
                isMicOn ? "bg-emerald-500 border-emerald-400" : "bg-white/10 border-white/10"
              )}
            >
              {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white/40" />}
            </button>
            <div className="relative">
              <button className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                <MessageSquare className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
