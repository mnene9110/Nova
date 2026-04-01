
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
        // Only go to onboarding if it's a brand new account
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
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-primary rounded-3xl shadow-xl flex items-center justify-center transform rotate-2">
            <span className="text-white text-3xl font-bold font-headline -rotate-2">MF</span>
          </div>
          <div className="absolute -inset-2 bg-primary/10 rounded-full blur-2xl -z-10" />
        </div>

        <h1 className="text-4xl font-logo text-primary mb-2">MatchFlow</h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-[240px] mb-12">
          Connect through voice, video, and conversations.
        </p>

        <div className="w-full space-y-3 max-w-xs">
          <Button 
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white text-base font-bold gap-2 shadow-lg shadow-primary/20"
            onClick={() => router.push("/login")}
          >
            <Mail className="w-5 h-5" />
            Continue with Email
          </Button>

          <Button 
            variant="secondary"
            className="w-full h-14 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-base font-bold gap-2"
            onClick={handleFastLogin}
          >
            {hasRecovery ? (
              <>
                <RotateCcw className="w-5 h-5" />
                Return to Guest Account
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Fast Login
              </>
            )}
          </Button>
        </div>

        <footer className="mt-10">
          <p className="text-[10px] text-muted-foreground leading-normal max-w-[200px]">
            By continuing, you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy</span>.
          </p>
        </footer>
      </main>
    </div>
  )
}
