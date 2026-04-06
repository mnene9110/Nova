
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Building2, Clock, CheckCircle2, LogOut, Wallet, ArrowRight, Gem, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useUser, useDoc, useMemoFirebase, useFirebase } from "@/firebase"
import { doc, updateDoc, getDoc, setDoc, collection, addDoc, serverTimestamp, deleteDoc, getDocs, query, limit, increment, runTransaction } from "firebase/firestore"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function JoinAgencyPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()
  
  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser?.uid])
  const { data: profile, isLoading } = useDoc(userRef)

  const [agencyId, setAgencyId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [diamondToConvert, setDiamondToConvert] = useState("")
  const [isSaturday, setIsSaturday] = useState(false)

  useEffect(() => {
    // 6 is Saturday in JavaScript (0 is Sunday)
    setIsSaturday(new Date().getDay() === 6);
  }, []);

  const diamondBalance = profile?.diamondBalance || 0;
  const diamondAmount = Number(diamondToConvert);
  const kesValue = Math.floor((diamondAmount / 1000) * 70);

  const handleSubmit = async () => {
    if (!agencyId.trim() || !currentUser || !firestore) {
      toast({ variant: "destructive", title: "Missing ID", description: "Please enter an agency ID." })
      return
    }

    setIsSubmitting(true)
    try {
      const aid = agencyId.trim();
      const agencyRef = doc(firestore, "agencies", aid)
      const agencySnap = await getDoc(agencyRef)

      if (!agencySnap.exists()) {
        toast({ variant: "destructive", title: "Invalid ID", description: "This Agency ID does not exist." })
        setIsSubmitting(false)
        return
      }

      const membersSnap = await getDocs(query(collection(firestore, "agencies", aid, "members"), limit(101)));
      if (membersSnap.size >= 100) {
        toast({ variant: "destructive", title: "Agency Full", description: "This agency has reached its maximum capacity of 100 members." });
        setIsSubmitting(false);
        return;
      }

      await setDoc(doc(firestore, "agencies", aid, "requests", currentUser.uid), {
        userId: currentUser.uid,
        username: profile?.username || "User",
        photo: profile?.profilePhotoUrls?.[0] || "",
        numericId: profile?.numericId || "",
        timestamp: serverTimestamp()
      })

      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        agencyJoinStatus: "pending",
        memberOfAgencyId: aid,
        updatedAt: new Date().toISOString()
      })

      toast({ title: "Application Sent", description: "Wait for the agent to review your request." })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit application." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLeaveAgency = async () => {
    if (!currentUser || !profile?.memberOfAgencyId || !firestore) return
    setIsSubmitting(true)
    try {
      const aid = profile.memberOfAgencyId
      await deleteDoc(doc(firestore, "agencies", aid, "members", currentUser.uid))

      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        agencyJoinStatus: "none",
        memberOfAgencyId: null,
        updatedAt: new Date().toISOString()
      })

      toast({ title: "Left Agency", description: "You are no longer a member." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawRequest = async () => {
    if (new Date().getDay() !== 6) {
      toast({ variant: "destructive", title: "Access Denied", description: "Withdrawals are only processed on Saturdays." });
      return;
    }

    if (!diamondAmount || diamondAmount < 1000 || !currentUser || !profile?.memberOfAgencyId || !firestore) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Minimum conversion is 1,000 diamonds." });
      return;
    }

    if (diamondBalance < diamondAmount) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }

    setIsSubmitting(true)
    try {
      const aid = profile.memberOfAgencyId
      
      await runTransaction(firestore, async (transaction) => {
        const profileSnap = await transaction.get(userRef!);
        const currentBalance = profileSnap.data()?.diamondBalance || 0;
        
        if (currentBalance < diamondAmount) throw new Error("INSUFFICIENT_DIAMONDS");

        // Create withdrawal request doc
        const withdrawalsRef = doc(collection(firestore, "agencies", aid, "withdrawals"))
        transaction.set(withdrawalsRef, {
          id: withdrawalsRef.id,
          userId: currentUser.uid,
          username: profile.username,
          photo: profile.profilePhotoUrls?.[0] || "",
          diamondAmount: diamondAmount,
          amount: kesValue, // KES
          status: 'pending',
          timestamp: serverTimestamp()
        })

        // Deduct diamonds from user
        transaction.update(userRef!, {
          diamondBalance: increment(-diamondAmount),
          updatedAt: new Date().toISOString()
        })

        // Log transaction
        const txRef = doc(collection(userRef!, "transactions"));
        transaction.set(txRef, {
          id: txRef.id,
          type: "agency_conversion",
          amount: -kesValue, // Not actual coins, just for log
          diamondAmount: -diamondAmount,
          transactionDate: new Date().toISOString(),
          description: `Requested cash conversion for ${diamondAmount} diamonds (Ksh ${kesValue})`
        });
      });

      toast({ title: "Request Sent", description: "The agent will notify you when paid." })
      setShowWithdrawDialog(false)
      setDiamondToConvert("")
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to submit", description: e.message === "INSUFFICIENT_DIAMONDS" ? "Not enough diamonds." : "Internal error." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  if (profile?.agencyJoinStatus === 'approved') {
    return (
      <div className="flex flex-col h-svh bg-white text-gray-900 font-body">
        <header className="px-4 py-6 flex items-center border-b border-gray-50 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
          <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">My Agency</h1>
        </header>
        <main className="flex-1 p-8 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center border-4 border-green-100">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black font-headline text-gray-900">Official Member</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Anchor ID: <span className="font-bold text-gray-900">{profile.memberOfAgencyId}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => setShowWithdrawDialog(true)} className="w-full h-24 bg-gray-50 border border-gray-100 rounded-[2rem] flex items-center px-6 gap-4 active:scale-95 transition-all relative overflow-hidden group">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600"><Gem className="w-6 h-6" /></div>
              <div className="flex-1 text-left">
                <span className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Diamond Income</span>
                <span className="text-sm font-black">Convert to Agency Cash</span>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarDays className={cn("w-3 h-3", isSaturday ? "text-green-500" : "text-amber-500")} />
                  <span className={cn("text-[8px] font-black uppercase tracking-tighter", isSaturday ? "text-green-600" : "text-amber-600")}>
                    {isSaturday ? "Requests Open Today" : "Next Opening: Saturday"}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </button>

            <button onClick={handleLeaveAgency} disabled={isSubmitting} className="w-full h-20 bg-red-50 border border-red-100 rounded-[2rem] flex items-center px-6 gap-4 active:scale-95 transition-all text-red-600">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center"><LogOut className="w-6 h-6" /></div>
              <div className="flex-1 text-left"><span className="text-[10px] font-black uppercase text-red-400/60 block tracking-widest">Membership</span><span className="text-sm font-black">Leave Agency Anchor</span></div>
            </button>
          </div>
        </main>

        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent className="rounded-[2.5rem] bg-white border-none p-8 max-w-[85%] mx-auto shadow-2xl">
            <DialogHeader><DialogTitle className="text-xl font-black font-headline text-gray-900 text-center uppercase tracking-widest">Withdraw Request</DialogTitle></DialogHeader>
            <div className="py-6 space-y-6">
              {!isSaturday && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 mb-2">
                  <CalendarDays className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-black uppercase leading-tight tracking-widest">Withdrawals are only accepted on Saturdays.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Diamonds to Convert</Label>
                <div className="relative">
                  <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <Input type="number" placeholder="Min. 1,000" value={diamondToConvert} onChange={(e) => setDiamondToConvert(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-lg px-10" />
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight text-right">Available: {diamondBalance.toLocaleString()}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-green-600">Expected Payout</span>
                <span className="text-sm font-black text-green-700">{kesValue.toLocaleString()} KES</span>
              </div>

              <p className="text-[9px] font-bold text-center text-gray-400 uppercase">Rate: 1,000 Diamonds = Ksh 70</p>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              <Button 
                onClick={handleWithdrawRequest} 
                disabled={!diamondToConvert || diamondAmount < 1000 || isSubmitting || !isSaturday} 
                className={cn("h-14 rounded-full text-white font-black uppercase text-xs tracking-widest w-full", isSaturday ? "bg-zinc-900" : "bg-gray-200 cursor-not-allowed")}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaturday ? "Submit to Agent" : "Closed (Sat Only)"}
              </Button>
              <Button variant="ghost" onClick={() => setShowWithdrawDialog(false)} className="h-12 rounded-full text-gray-400 font-black uppercase text-[10px]">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

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
              The agent is reviewing your request. You'll be notified once approved.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-svh bg-white text-gray-900 font-body">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-900 h-10 w-10 bg-gray-50 rounded-full hover:bg-gray-100"><ChevronLeft className="w-6 h-6" /></Button>
        <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">Join the anchor</h1>
      </header>

      <main className="flex-1 p-8 space-y-10">
        <div className="space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center"><Building2 className="w-8 h-8 text-primary" /></div>
          <h2 className="text-3xl font-black font-headline text-gray-900 tracking-tight">Agency ID</h2>
          <div className="relative"><Input placeholder="Please enter the agency ID" value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className="h-14 bg-transparent border-0 border-b-2 border-gray-100 rounded-none px-0 text-lg font-medium focus-visible:ring-0 focus-visible:border-primary placeholder:text-gray-300" /></div>
          <p className="text-[13px] text-gray-400 font-medium leading-relaxed max-w-[300px]">After approval, you will join the official team.</p>
        </div>
        <div className="pt-20"><Button onClick={handleSubmit} disabled={isSubmitting || !agencyId.trim()} className="w-full h-16 rounded-full bg-primary text-white font-black text-lg shadow-2xl active:scale-95 transition-all">{isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Apply for Membership"}</Button></div>
      </main>
    </div>
  )
}
