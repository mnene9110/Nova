
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { ref, onValue, off, remove } from "firebase/database"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { getZegoConfig } from "@/app/actions/zego"

/**
 * @fileOverview Party Room Page using ZegoCloud Prebuilt UI.
 * Fixed: Token authentication error by using real serverSecret from env.
 */

export default function PartyRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { database, firestore } = useFirebase()
  const { toast } = useToast()

  const [room, setRoom] = useState<any>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const zpRef = useRef<any>(null)

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile } = useDoc(userProfileRef)

  // 1. Monitor Room Existence
  useEffect(() => {
    if (!database || !roomId) return
    const roomRef = ref(database, `partyRooms/${roomId}`)
    const unsubscribe = onValue(roomRef, (snap) => {
      const data = snap.val()
      if (data) {
        setRoom(data)
      } else {
        toast({ title: "Room Closed", description: "This party has ended." })
        router.push('/party')
      }
    })
    return () => off(roomRef, "value", unsubscribe)
  }, [database, roomId, router, toast])

  // 2. Initialize Zego Prebuilt UI
  useEffect(() => {
    if (!roomId || !currentUser || !profile || !containerRef.current || zpRef.current || !room) return;

    const initZego = async () => {
      try {
        const config = await getZegoConfig();
        if (!config.appID || !config.serverSecret) {
          throw new Error("Zego Configuration (AppID or ServerSecret) is missing in environment variables.");
        }

        // Dynamically import the Prebuilt SDK
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

        // Generate the kitToken using the real serverSecret
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          config.appID,
          config.serverSecret,
          roomId,
          currentUser.uid,
          profile.username || "User"
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        const isHost = room.hostId === currentUser.uid;

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
          showUserList: true,
          onLeaveRoom: () => {
            router.push('/party');
          }
        });

        setIsInitializing(false);
      } catch (error: any) {
        console.error("Zego Prebuilt Error:", error);
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: error.message || "Token authentication error. Check your Zego AppID and ServerSecret." 
        });
        setIsInitializing(false);
      }
    };

    initZego();

    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
        zpRef.current = null;
      }
    };
  }, [roomId, currentUser, !!profile, !!room]);

  const handleDeleteRoom = async () => {
    if (!database || !roomId || !room) return
    await remove(ref(database, `partyRooms/${roomId}`))
    router.push('/party')
  }

  const isHost = currentUser && room?.hostId === currentUser.uid

  return (
    <div className="flex flex-col h-svh bg-white text-gray-900 overflow-hidden relative font-body">
      <header className="px-4 py-6 flex items-center justify-between z-50 bg-white border-b border-gray-50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-10 w-10 bg-gray-50 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest leading-none">{room?.title || "Party Room"}</h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Live Interaction</span>
          </div>
        </div>

        {isHost && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteRoom}
            className="rounded-full px-4 h-9 font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            End Party
          </Button>
        )}
      </header>

      <main className="flex-1 relative bg-gray-50">
        {isInitializing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase text-gray-400 mt-4 tracking-widest">Connecting to Stage...</p>
          </div>
        )}
        
        {/* Zego Prebuilt Container */}
        <div ref={containerRef} className="w-full h-full" />
      </main>
    </div>
  )
}
