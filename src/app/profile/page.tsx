"use client"

import { 
  ChevronRight, 
  Copy, 
  Coins, 
  Headset, 
  Pencil,
  ShieldCheck,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  Award,
  Zap,
  Gem,
  Gamepad2,
  ShieldAlert,
  ClipboardList,
  Building2,
  Crown
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useUser, useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export default function ProfilePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()
  
  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: userProfile, isLoading } = useDoc(userRef)
  
  const [pendingReportsCount, setPendingReportsCount] = useState(0)

  useEffect(() => {
    if (!firestore || !userProfile?.isSupport) return
    const q = query(collection(firestore, "reports"), where("status", "==", "pending"), limit(1));
    getDocs(q).then(snap => setPendingReportsCount(snap.size));
  }, [firestore, userProfile?.isSupport])

  const copyId = () => {
    if (userProfile?.numericId) {
      navigator.clipboard.writeText(userProfile.numericId.toString());
      toast({ title: "ID Copied", description: "User ID copied." });
    }
  }

  const handleContactSupport = async () => {
    if (!firestore) return
    try {
      const q = query(collection(firestore, "userProfiles"), where("isSupport", "==", true), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Support Unavailable" })
      } else {
        router.push(`/chat/${snap.docs[0].id}`)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error" })
    }
  }

  const userImage = (userProfile?.profilePhotoUrls && userProfile?.profilePhotoUrls[0]) || ""
  const isVerified = !!userProfile?.isVerified

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-transparent"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>

  return (
    <div className="flex flex-col h-svh w-full bg-transparent text-gray-900 overflow-y-auto scroll-smooth">
      <header className="flex flex-col items-center pt-16 pb-8 px-6 shrink-0 relative">
        <div className="relative mb-6 group">
          <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-amber-400 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Avatar className="w-36 h-36 relative bg-white border-4 border-white native-shadow">
            {userImage && <AvatarImage src={userImage} className="object-cover" />}
            <AvatarFallback className="bg-primary/5 text-primary font-black text-4xl">{userProfile?.username?.[0]}</AvatarFallback>
          </Avatar>
          <button 
            onClick={() => router.push('/profile/edit')} 
            className="absolute bottom-1 right-1 w-11 h-11 rounded-2xl bg-zinc-900 border-4 border-white flex items-center justify-center shadow-xl active:scale-90 transition-all"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
          {isVerified && (
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 native-shadow">
              <CheckCircle className="w-6 h-6 text-blue-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-center font-headline">{userProfile?.username || "Nova User"}</h1>
            {userProfile?.isPartyAdmin && <Crown className="w-5 h-5 text-amber-500" />}
          </div>
          <button 
            onClick={copyId} 
            className="flex items-center gap-2 px-5 py-2 glass-card rounded-full active:scale-95 transition-all native-shadow"
          >
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">ID: {userProfile?.numericId || '---'}</span>
            <Copy className="w-3 h-3 text-primary/40" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 space-y-10 pb-44">
        {/* Modern Wallet Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-[2.5rem] p-6 flex flex-col items-center gap-3 native-shadow border-white/60">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Balance</span>
              <span className="text-2xl font-black text-gray-900 font-headline">{(userProfile?.coinBalance || 0).toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => router.push('/recharge')} 
              className="w-full h-9 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[9px] tracking-widest native-shadow"
            >
              Recharge
            </Button>
          </div>

          <div className="bg-zinc-900 rounded-[2.5rem] p-6 flex flex-col items-center gap-3 native-shadow border border-zinc-800">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Gem className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Earnings</span>
              <span className="text-2xl font-black text-white font-headline">{(userProfile?.diamondBalance || 0).toLocaleString()}</span>
            </div>
            <Button 
              onClick={() => router.push('/profile/income')} 
              className="w-full h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-black uppercase text-[9px] tracking-widest"
            >
              Income
            </Button>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Entertainment</h3>
          
          <button 
            onClick={() => router.push('/games')} 
            className="w-full h-20 glass-card rounded-[2.25rem] flex items-center px-6 gap-5 native-shadow group active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-tr from-primary to-[#EB4C4C] flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Games Center</span>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Play & Win Coins</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          {userProfile?.isAgent && (
            <button 
              onClick={() => router.push('/profile/agent-center')} 
              className="w-full h-20 bg-zinc-950 rounded-[2.25rem] flex items-center px-6 gap-5 active:scale-[0.98] transition-all native-shadow"
            >
              <div className="w-12 h-12 rounded-[1.25rem] bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-white font-black uppercase tracking-[0.1em] text-[11px] block">Agent Center</span>
                <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-tighter">Manage Official Agency</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>
          )}

          {userProfile?.gender?.toLowerCase() === 'female' && !userProfile?.isAgent && (
            <button 
              onClick={() => router.push('/profile/agency')} 
              className="w-full h-20 glass-card rounded-[2.25rem] flex items-center px-6 gap-5 native-shadow group active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Agency Anchor</span>
                <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Work & Earn Rewards</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Support & Tools</h3>
          
          <button 
            onClick={() => router.push('/profile/verify')} 
            className="w-full h-16 glass-card rounded-[1.75rem] flex items-center justify-between px-6 native-shadow transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isVerified ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400")}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px]">{isVerified ? "Verified User" : "Identity Verification"}</span>
            </div>
            {isVerified ? <CheckCircle className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
          </button>

          <button 
            onClick={handleContactSupport} 
            className="w-full h-16 glass-card rounded-[1.75rem] flex items-center px-6 gap-4 native-shadow transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
              <Headset className="w-5 h-5" />
            </div>
            <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px] flex-1 text-left">Customer Service</span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => router.push('/settings')} 
            className="w-full h-16 glass-card rounded-[1.75rem] flex items-center px-6 gap-4 native-shadow transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-gray-500 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px] flex-1 text-left">Account Settings</span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </main>
    </div>
  )
}
