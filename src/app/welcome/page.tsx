"use client"

import { useEffect, useState } from "react"
import { Mail, Zap, Loader2, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth, useUser, initiateAnonymousSignIn, useFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function WelcomePage() {
  const router = useRouter()
  const auth = useAuth()
  const { firestore } = useFirebase()
  const { user, isUserLoading } = useUser()
  const { toast } = useToast()
  
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isNavigatingEmail, setIsNavigatingEmail] = useState(false)

  useEffect(() => {
    if (user && !isUserLoading && firestore && !isLoggingIn) {
      getDoc(doc(firestore, "userProfiles", user.uid)).then(snap => {
        if (snap.exists()) {
          router.replace("/discover")
        } else {
          router.replace("/onboarding/fast")
        }
      })
    }
  }, [user, isUserLoading, firestore, router, isLoggingIn])

  const handleFastLogin = async () => {
    if (isLoggingIn || isNavigatingEmail) return
    setIsLoggingIn(true)
    
    try {
      const cred = await initiateAnonymousSignIn(auth)
      if (firestore) {
        const snap = await getDoc(doc(firestore, "userProfiles", cred.user.uid))
        if (snap.exists()) {
          router.push("/discover")
        } else {
          router.push("/onboarding/fast")
        }
      }
    } catch (error: any) {
      setIsLoggingIn(false)
      console.error("Fast login failed:", error)
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An error occurred during fast login. Please check your connection.",
      })
    }
  }

  const handleEmailClick = () => {
    setIsNavigatingEmail(true)
    router.push("/login")
  }

  if (isUserLoading || (user && !isLoggingIn)) {
    return (
      <div className="flex h-svh w-full bg-[#EB4C4C]" />
    )
  }

  return (
    <div className="flex flex-col h-svh bg-zinc-950 relative overflow-hidden">
      {/* Background Video with Blur and no tint */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-50 blur-[4px]"
        >
          <source src="/welcome-bg.mp4" type="video/mp4" />
        </video>
        {/* Deep Vignette for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
      </div>

      {/* Content Overlay */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10 pt-20">
        <div className="mb-12 relative">
          {/* Animated Glow Logo Container */}
          <div className="w-44 h-44 bg-white/10 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 flex flex-col items-center justify-center animate-float relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-inner border border-white/10 mb-1">
                <Heart className="w-10 h-10 text-white fill-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              </div>
              <h2 className="text-white font-logo text-3xl tracking-tight drop-shadow-md">Matchflow</h2>
            </div>
          </div>
          
          {/* Background Decorative Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/5 rounded-full animate-[pulse_6s_ease-in-out_infinite]" />
        </div>

        <div className="space-y-3 mb-16">
          <h1 className="text-5xl font-logo text-white drop-shadow-2xl">Matchflow</h1>
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <p className="text-white/90 text-[12px] font-black uppercase tracking-[0.3em]">Connect with Heart</p>
          </div>
        </div>

        <div className="w-full space-y-4 max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Button 
            className="w-full h-20 rounded-[2.25rem] bg-white text-[#EB4C4C] hover:bg-white/90 text-xl font-black gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all active:scale-95 flex items-center justify-center border-t border-white/20" 
            onClick={handleEmailClick}
            disabled={isNavigatingEmail || isLoggingIn}
          >
            {isNavigatingEmail ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-7 h-7" />}
            Continue with Email
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full h-20 rounded-[2.25rem] bg-white/10 text-white border border-white/20 hover:bg-white/20 text-xl font-black gap-4 transition-all active:scale-95 backdrop-blur-md shadow-sm flex items-center justify-center" 
            onClick={handleFastLogin} 
            disabled={isLoggingIn || isNavigatingEmail}
          >
            {isLoggingIn ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-7 h-7 fill-white text-white" />}
            Fast Entry
          </Button>

          <div className="pt-4 px-4">
            <p className="text-[11px] text-white/60 font-bold text-center leading-relaxed uppercase tracking-widest">
              By signing up, you agree to our <br />
              <span onClick={() => router.push('/settings/terms')} className="underline cursor-pointer hover:text-white transition-colors">Terms</span>
              <span className="mx-2">•</span>
              <span onClick={() => router.push('/settings/privacy')} className="underline cursor-pointer hover:text-white transition-colors">Privacy</span>
            </p>
          </div>
        </div>

        <div className="h-20" />
      </main>
    </div>
  )
}
