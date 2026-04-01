"use client"

import { useEffect, useState } from "react"
import { Mail, Zap, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth, useUser, initiateAnonymousSignIn } from "@/firebase"

export default function WelcomePage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [hasRecovery, setHasRecovery] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (user) {
      router.push("/discover")
    }
  }, [user, router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasRecovery(!!localStorage.getItem('mf_guest_recovery'))
    }
  }, [])

  const handleFastLogin = () => {
    setIsLoggingIn(true)
    initiateAnonymousSignIn(auth)
      .then((cred) => {
        const isNew = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
        if (isNew) {
          router.push("/onboarding/fast")
        } else {
          router.push("/discover")
        }
      })
      .catch((error) => {
        setIsLoggingIn(false)
        console.error("Fast login failed:", error)
      })
  }

  if (isUserLoading || isLoggingIn) {
    return (
      <div className="flex flex-col h-svh bg-white items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-svh bg-white relative overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
        <div className="mb-6 relative">
          <div className="w-24 h-24 bg-primary/5 backdrop-blur-xl rounded-[2.5rem] shadow-xl flex items-center justify-center border border-primary/10 transform rotate-3 animate-float">
            <span className="text-primary text-4xl font-bold font-headline -rotate-3 drop-shadow-sm">MF</span>
          </div>
        </div>

        <h1 className="text-5xl font-logo text-primary mb-2">MatchFlow</h1>

        <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[240px] mb-12">
          Connect through voice, video, and premium conversations.
        </p>

        <div className="w-full space-y-4 max-w-xs">
          <Button 
            className="w-full h-16 rounded-full bg-primary text-white hover:bg-primary/90 text-lg font-black gap-3 shadow-xl transition-all active:scale-95"
            onClick={() => router.push("/login")}
          >
            <Mail className="w-6 h-6" />
            Continue with Email
          </Button>

          <Button 
            variant="ghost"
            className="w-full h-16 rounded-full bg-gray-50 text-gray-900 border border-gray-100 hover:bg-gray-100 text-lg font-black gap-3 transition-all active:scale-95"
            onClick={handleFastLogin}
          >
            {hasRecovery ? (
              <>
                <RotateCcw className="w-6 h-6 text-primary" />
                Return to Account
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 fill-current text-primary" />
                Fast Login
              </>
            )}
          </Button>
        </div>

        <footer className="mt-12">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-normal max-w-[200px]">
            By continuing, you agree to our <span className="underline decoration-gray-200 cursor-pointer">Terms</span> and <span className="underline decoration-gray-200 cursor-pointer">Privacy</span>.
          </p>
        </footer>
      </main>
    </div>
  )
}
