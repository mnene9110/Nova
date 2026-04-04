
"use client"

import { useState, useEffect, useRef, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Mic, MicOff, Video, VideoOff, LogOut, Loader2, Users, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, increment as firestoreIncrement } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getTencentUserSig } from "@/app/actions/tencent"

let TRTC: any = null;

export default function PartyRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()

  const [isJoined, setIsJoined] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])

  const trtcClientRef = useRef<any>(null)
  const localStreamRef = useRef<any>(null)
  const remoteContainerRef = useRef<HTMLDivElement>(null)

  const roomRef = useMemoFirebase(() => roomId ? doc(firestore, "partyRooms", roomId) : null, [firestore, roomId])
  const { data: room, isLoading: isRoomLoading } = useDoc(roomRef)

  useEffect(() => {
    if (typeof window !== "undefined") {
      import('trtc-js-sdk').then((module) => {
        TRTC = module.default;
        initRoom();
      });
    }
    return () => handleLeave();
  }, []);

  const initRoom = async () => {
    if (!currentUser || !roomId || !TRTC) return;

    try {
      const { userSig, sdkAppId } = await getTencentUserSig(currentUser.uid);
      
      const client = TRTC.createClient({
        mode: 'rtc',
        sdkAppId,
        userId: currentUser.uid,
        userSig
      });
      trtcClientRef.current = client;

      // Handle remote users
      client.on('stream-subscribed', (event: any) => {
        const remoteStream = event.stream;
        setRemoteUsers(prev => [...prev, { userId: remoteStream.getUserId(), stream: remoteStream }]);
        // In a real app, you'd find a div for this user and call remoteStream.play(divId)
      });

      client.on('stream-removed', (event: any) => {
        const remoteStream = event.stream;
        setRemoteUsers(prev => prev.filter(u => u.userId !== remoteStream.getUserId()));
      });

      await client.join({ roomId: Number(roomId.replace(/\D/g, '').slice(0, 8)) || 12345 });
      
      const localStream = TRTC.createStream({ userId: currentUser.uid, audio: true, video: false });
      localStreamRef.current = localStream;
      
      await localStream.initialize();
      await client.publish(localStream);
      
      setIsJoined(true);
      setIsConnecting(false);

      // Update member count in Firestore
      if (roomRef) {
        updateDoc(roomRef, { memberCount: firestoreIncrement(1) });
      }

    } catch (error: any) {
      console.error("TRTC Join Error:", error);
      toast({ variant: "destructive", title: "Join Failed", description: "Could not connect to room." });
      router.back();
    }
  }

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    if (isMicOn) {
      localStreamRef.current.muteAudio();
    } else {
      localStreamRef.current.unmuteAudio();
    }
    setIsMicOn(!isMicOn);
  }

  const handleLeave = async () => {
    if (trtcClientRef.current) {
      if (localStreamRef.current) {
        await trtcClientRef.current.unpublish(localStreamRef.current);
        localStreamRef.current.close();
      }
      await trtcClientRef.current.leave();
    }
    if (roomRef && isJoined) {
      updateDoc(roomRef, { memberCount: firestoreIncrement(-1) });
    }
    router.push('/party');
  }

  if (isRoomLoading || isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-svh bg-zinc-950 text-white space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-primary/20 border-2 border-primary/40 flex items-center justify-center animate-pulse">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black font-headline uppercase tracking-widest">Entering Room</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Securing group connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-svh bg-zinc-950 text-white overflow-hidden">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="h-10 w-10 bg-white/5 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
          <div>
            <h1 className="text-lg font-black font-headline truncate max-w-[180px]">{room?.title || "Party Room"}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Host: {room?.hostName}</span>
              <Crown className="w-3 h-3 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tighter">{room?.memberCount || 1} Live</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 grid grid-cols-2 gap-4 pb-32 pt-4">
        {/* Host Tile */}
        <div className="aspect-[3/4] bg-zinc-900 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-2xl relative overflow-hidden">
          <Avatar className="w-20 h-20 border-4 border-primary/20">
            <AvatarImage src={room?.hostPhoto} className="object-cover" />
            <AvatarFallback className="bg-primary text-xl font-black">{room?.hostName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">The Host</p>
            <p className="text-sm font-bold text-zinc-400 mt-1">{room?.hostName}</p>
          </div>
          <div className="absolute top-4 right-4 bg-zinc-950/50 p-2 rounded-full">
             <Crown className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Local User Tile */}
        <div className="aspect-[3/4] bg-zinc-900 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-2xl">
          <Avatar className="w-20 h-20 border-4 border-zinc-800">
            <AvatarImage src={currentUser?.photoURL || ""} className="object-cover" />
            <AvatarFallback className="bg-zinc-800 text-xl font-black">Me</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">You</p>
            {!isMicOn && <MicOff className="w-4 h-4 text-red-500 mx-auto mt-2" />}
          </div>
        </div>

        {/* Remote Users will go here */}
        {remoteUsers.map(u => (
          <div key={u.userId} className="aspect-[3/4] bg-zinc-900 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Avatar className="w-20 h-20 border-4 border-zinc-800">
              <AvatarFallback className="bg-zinc-800 text-xl font-black">?</AvatarFallback>
            </Avatar>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Participant</p>
          </div>
        ))}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
        <button onClick={toggleMic} className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl", isMicOn ? "bg-white/10 text-white border border-white/10" : "bg-red-500 text-white")}>
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        <button onClick={handleLeave} className="w-20 h-20 rounded-[2rem] bg-red-500 flex items-center justify-center shadow-2xl active:scale-90 transition-all border-4 border-zinc-950">
          <LogOut className="w-8 h-8 text-white" />
        </button>
        <button className="w-16 h-16 rounded-full bg-white/10 text-white/40 flex items-center justify-center border border-white/10 cursor-not-allowed">
          <Video className="w-6 h-6" />
        </button>
      </footer>
    </div>
  )
}
