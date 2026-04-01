
"use client"

import { useEffect, useState } from "react"
import { Mail, Zap, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth, useUser, initiateAnonymousSignIn } from "@/firebase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function WelcomePage() {
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)

  useEffect(() => {
    if (user) {
      router.replace("/discover")
    }
  }, [user, router])

  const checkAccountLimit = () => {
    if (typeof window === 'undefined') return false;
    const uids = JSON.parse(localStorage.getItem('mf_device_uids') || '[]');
    if (uids.length >= 2) {
      localStorage.setItem('mf_suspicious', 'true');
      return true;
    }
    return false;
  }

  const handleFastLogin = () => {
    if (checkAccountLimit()) {
      setShowLimitDialog(true);
      return;
    }

    setIsLoggingIn(true)
    initiateAnonymousSignIn(auth)
      .then((cred) => {
        // Track the UID
        if (typeof window !== 'undefined') {
          const uids = JSON.parse(localStorage.getItem('mf_device_uids') || '[]');
          if (!uids.includes(cred.user.uid)) {
            uids.push(cred.user.uid);
            localStorage.setItem('mf_device_uids', JSON.stringify(uids));
          }
        }

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

  if (isUserLoading || user) {
    return (
      <div className="flex h-svh w-full bg-[#B36666]" />
    )
  }

  return (
    <div className="flex flex-col h-svh bg-transparent relative overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
        <div className="mb-6 relative">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2.2rem] shadow-xl flex items-center justify-center border border-white/30 transform rotate-3 animate-float">
            <span className="text-primary text-3xl font-bold font-headline -rotate-3 drop-shadow-sm">MF</span>
          </div>
        </div>

        <h1 className="text-4xl font-logo text-primary mb-1">MatchFlow</h1>

        <p className="text-gray-600 text-[13px] font-medium leading-relaxed max-w-[220px] mb-10">
          Connect through voice, video, and premium conversations.
        </p>

        <div className="w-full space-y-3.5 max-w-xs">
          <Button 
            className="w-full h-14 rounded-full bg-primary text-white hover:bg-primary/90 text-base font-black gap-3 shadow-xl transition-all active:scale-95"
            onClick={() => router.push("/login")}
          >
            <Mail className="w-5 h-5" />
            Continue with Email
          </Button>

          <Button 
            variant="ghost"
            className="w-full h-14 rounded-full bg-white/40 text-gray-900 border border-white/30 hover:bg-white/60 text-base font-black gap-3 transition-all active:scale-95 backdrop-blur-md"
            onClick={handleFastLogin}
            disabled={isLoggingIn}
          >
            <Zap className="w-5 h-5 fill-current text-primary" />
            Fast Login
          </Button>
        </div>

        <footer className="mt-10">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-normal max-w-[180px]">
            By continuing, you agree to our <span className="underline decoration-gray-200 cursor-pointer">Terms</span> and <span className="underline decoration-gray-200 cursor-pointer">Privacy</span>.
          </p>
        </footer>
      </main>

      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent className="rounded-[2.5rem] bg-white border-none shadow-2xl p-8 max-w-[90%] mx-auto">
          <AlertDialogHeader className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black font-headline text-gray-900 text-center">Limit Reached</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-500 font-medium">
              You have reached the max limit account of account creation on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction className="w-full h-14 rounded-full bg-zinc-900 text-white font-black">Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
