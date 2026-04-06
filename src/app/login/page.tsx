
"use client"

import { useState, useEffect } from "react"
import { Mail, Lock, ChevronLeft, Loader2, ShieldCheck, ShieldAlert, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp, useFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    if (user && !user.isAnonymous && firestore) {
      getDoc(doc(firestore, "userProfiles", user.uid)).then(snap => {
        if (snap.exists()) {
          router.push("/discover")
        } else {
          router.push("/onboarding/full")
        }
      })
    }
  }, [user, router, firestore])

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-gray-200" }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score, label: "Weak", color: "bg-red-500" }
    if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" }
    if (score <= 3) return { score, label: "Strong", color: "bg-green-500" }
    return { score, label: "Very Strong", color: "bg-emerald-500" }
  }

  const strength = getPasswordStrength(password)

  const handleSignIn = () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter both email and password." })
      return
    }
    setIsPending(true)
    initiateEmailSignIn(auth, email, password).catch((error: any) => {
      setIsPending(false)
      toast({ variant: "destructive", title: "Sign In Failed", description: error.message || "Invalid email or password." })
    })
  }

  const handleSignUp = () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please enter both email and password." })
      return
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." })
      return
    }
    setIsPending(true)
    initiateEmailSignUp(auth, email, password).catch((error: any) => {
      setIsPending(false)
      if (error.code === 'auth/email-already-in-use') {
        toast({ variant: "destructive", title: "Account Exists", description: "This email is already registered. Please sign in instead." })
      } else {
        toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "Could not create account." })
      }
    })
  }

  return (
    <div className="flex flex-col h-svh bg-white relative overflow-hidden text-gray-900">
      <header className="absolute top-12 left-2 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-400 hover:bg-transparent"><ChevronLeft className="w-8 h-8" /></Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 w-full max-w-sm mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-logo text-primary">nova</h1>
          <p className="text-gray-400 text-lg font-medium">Sign in to find your perfect match</p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-16 pl-12 rounded-2xl bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 text-lg focus-visible:ring-primary/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary ml-1 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input type="password" placeholder="........" value={password} onChange={(e) => setPassword(e.target.value)} className="h-16 pl-12 rounded-2xl bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 text-lg focus-visible:ring-primary/50" />
            </div>
            
            {password.length > 0 && (
              <div className="px-1 pt-2 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Strength</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", strength.label === "Weak" ? "text-red-500" : "text-green-500")}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn("h-full flex-1 transition-all duration-500 rounded-full", strength.score >= i ? strength.color : "bg-gray-200")} />
                  ))}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-tight">
                  Mix uppercase, lowercase, numbers & symbols for maximum safety.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full space-y-4 pt-4">
          <Button className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-white text-xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center" onClick={handleSignIn} disabled={isPending}>{isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}</Button>
          <Button variant="ghost" className="w-full h-16 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-900 text-xl font-bold transition-all active:scale-95 flex items-center justify-center" onClick={handleSignUp} disabled={isPending}>{isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Account"}</Button>
        </div>

        <footer className="pt-4">
          <p className="text-[13px] text-gray-400 text-center leading-relaxed max-w-[280px]">By signing in, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline decoration-gray-200 cursor-pointer">Privacy Policy</span>.</p>
        </footer>
      </main>
    </div>
  )
}
