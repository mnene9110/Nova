
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Building2, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function JoinAgencyPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile, isLoading } = useDoc(userRef)

  const [agencyId, setAgencyId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!agencyId.trim() || !currentUser) {
      toast({ variant: "destructive", title: "Missing ID", description: "Please enter an agency ID." })
      return
    }

    setIsSubmitting(true)
    try {
      const agencyRef = doc(firestore, "agencies", agencyId.trim())
      const agencySnap = await getDoc(agencyRef)

      if (!agencySnap.exists()) {
        toast({ variant: "destructive", title: "Invalid ID", description: "This Agency ID does not exist." })
        setIsSubmitting(false)
        return
      }

      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        agencyJoinStatus: "pending",
        memberOfAgencyId: agencyId.trim(),
        updatedAt: new Date().toISOString()
      })

      toast({ title: "Application Sent", description: "Wait for the agent to review your request." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit application." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelApplication = async () => {
    if (!currentUser) return
    setIsSubmitting(true)
    try {
      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        agencyJoinStatus: "none",
        memberOfAgencyId: null,
        updatedAt: new Date().toISOString()
      })
      toast({ title: "Cancelled", description: "Your application has been withdrawn." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to cancel." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  // 1. Approved State
  if (profile?.agencyJoinStatus === 'approved') {
    return (
      <div className="flex flex-col h-svh bg-white text-gray-900 font-body">
        <header className="px-4 py-6 flex items-center border-b border-gray-50 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
          <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">My Agency</h1>
        </header>
        <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center border-4 border-green-100">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-headline text-gray-900">Official Member</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              You are now part of the agency!<br />Your ID: <span className="font-bold text-gray-900">{profile.memberOfAgencyId}</span>
            </p>
          </div>
          <Button onClick={() => router.back()} className="h-14 w-full max-w-[200px] rounded-full bg-zinc-900 text-white font-black uppercase text-xs tracking-widest">Done</Button>
        </main>
      </div>
    )
  }

  // 2. Pending State
  if (profile?.agencyJoinStatus === 'pending') {
    return (
      <div className="flex flex-col h-svh bg-white text-gray-900 font-body">
        <header className="px-4 py-6 flex items-center border-b border-gray-50 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
          <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">Application Status</h1>
        </header>
        <main className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center border-4 border-amber-100 animate-pulse">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-headline text-gray-900">Pending Review</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[240px]">
              The agent is currently reviewing your request to join. You'll be notified once approved.
            </p>
          </div>
          <div className="pt-10 w-full max-w-xs space-y-3">
            <Button variant="ghost" onClick={handleCancelApplication} disabled={isSubmitting} className="w-full text-red-500 font-black uppercase text-[10px] tracking-widest">
              Withdraw Application
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // 3. None / Rejected State
  return (
    <div className="flex flex-col h-svh bg-white text-gray-900 font-body">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-gray-50 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">Join the anchor</h1>
      </header>

      <main className="flex-1 p-8 space-y-10">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-black font-headline text-gray-900 tracking-tight">Agency ID</h2>
          
          <div className="relative">
            <Input 
              placeholder="Please enter the agency ID" 
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="h-14 bg-transparent border-0 border-b-2 border-gray-100 rounded-none px-0 text-lg font-medium focus-visible:ring-0 focus-visible:border-primary placeholder:text-gray-300"
            />
          </div>

          <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-[300px]">
            After the agency owner approves your application, you will join the official team.
          </p>
        </div>

        <div className="pt-20">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !agencyId.trim()}
            className="w-full h-16 rounded-full bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Applications for Membership"}
          </Button>
        </div>
      </main>
    </div>
  )
}
