
"use client"

import { useState, useEffect } from "react"
import { Mail, Lock, ChevronLeft, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !user.isAnonymous) {
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
      if (isNewUser) {
        router.push("/onboarding/full")
      } else {
        router.push("/discover")
      }
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

  const trackUid = (uid: string) => {
    if (typeof window !== 'undefined') {
      const uids = JSON.parse(localStorage.getItem('mf_device_uids') || '[]');
      if (!uids.includes(uid)) {
        uids.push(uid);
        localStorage.setItem('mf_device_uids', JSON.stringify(uids));
      }
    }
  }

  const handleSignIn = () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both email and password.",
      })
      return
    }

    setIsPending(true)
    initiateEmailSignIn(auth, email, password)
      .then((cred) => {
        trackUid(cred.user.uid);
      })
      .catch((error: any) => {
        setIsPending(false)
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
        })
      })
  }

  const handleSignUp = () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both email and password.",
      })
      return
    }

    if (checkAccountLimit()) {
      setShowLimitDialog(true);
      return;
    }

    setIsPending(true)
    initiateEmailSignUp(auth, email, password)
      .then((cred) => {
        trackUid(cred.user.uid);
      })
      .catch((error: any) => {
        setIsPending(false)
        if (error.code === 'auth/email-already-in-use') {
          toast({
            variant: "destructive",
            title: "Account Exists",
            description: "This email is already registered. Please sign in instead.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message || "Could not create account.",
          })
        }
      })
  }

  return (
    <div className="flex flex-col h-svh bg-white relative overflow-hidden text-gray-900">
      <header className="absolute top-12 left-2 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-400 hover:bg-transparent"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 w-full max-w-sm mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-logo text-primary">MatchFlow</h1>
          <p className="text-gray-400 text-lg font-medium">
            Sign in to find your perfect match
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 pl-12 rounded-2xl bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 text-lg focus-visible:ring-primary/50" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input 
                type="password" 
                placeholder="........" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 pl-12 rounded-2xl bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 text-lg focus-visible:ring-primary/50" 
              />
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 pt-4">
          <Button 
            className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-white text-xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center"
            onClick={handleSignIn}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
          </Button>

          <Button 
            variant="ghost"
            className="w-full h-16 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-900 text-xl font-bold transition-all active:scale-95 flex items-center justify-center"
            onClick={handleSignUp}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Account"}
          </Button>
        </div>

        <footer className="pt-4">
          <p className="text-[13px] text-gray-400 text-center leading-relaxed max-w-[280px]">
            By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline decoration-gray-200 cursor-pointer">Privacy Policy</span>.
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
