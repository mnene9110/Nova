
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
      toast({ title: "Copied!", description: "User ID copied." });
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
      {/* Premium Header */}
      <header className="flex flex-col items-center pt-12 pb-8 px-6 shrink-0 relative">
        <div className="relative mb-6 group">
          <div className="absolute -inset-1 bg-gradient-to-tr from-red-500 to-amber-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <Avatar className="w-32 h-32 border-4 border-white shadow-2xl relative bg-white">
            {userImage && <AvatarImage src={userImage} className="object-cover" />}
            <AvatarFallback className="bg-red-50 text-red-500 font-black text-3xl">{userProfile?.username?.[0]}</AvatarFallback>
          </Avatar>
          <button 
            onClick={() => router.push('/profile/edit')} 
            className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center shadow-xl active:scale-90 transition-all hover:bg-black"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
          {isVerified && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
              <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/10" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-center font-headline">{userProfile?.username || "Nova User"}</h1>
            {userProfile?.isPartyAdmin && <Crown className="w-5 h-5 text-amber-500" />}
          </div>
          <button 
            onClick={copyId} 
            className="flex items-center gap-2 px-4 py-1.5 bg-white/40 backdrop-blur-md border border-white/30 rounded-full active:scale-95 transition-all"
          >
            <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">ID: {userProfile?.numericId || '---'}</span>
            <Copy className="w-3 h-3 text-green-600/40" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 space-y-8 pb-44">
        {/* Wallet Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group overflow-hidden bg-white/60 backdrop-blur-2xl border border-white rounded-[2.5rem] p-6 flex flex-col items-center gap-3 shadow-xl transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Coin Wallet</span>
            </div>
            <span className="text-3xl font-black text-gray-900 font-headline tracking-tighter">{(userProfile?.coinBalance || 0).toLocaleString()}</span>
            <Button 
              onClick={() => router.push('/recharge')} 
              className="w-full h-10 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Recharge</span>
            </Button>
          </div>

          <div className="relative group overflow-hidden bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 flex flex-col items-center gap-3 shadow-xl transition-all hover:bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Gem className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Income Center</span>
            </div>
            <span className="text-3xl font-black text-white font-headline tracking-tighter">{(userProfile?.diamondBalance || 0).toLocaleString()}</span>
            <Button 
              onClick={() => router.push('/profile/income')} 
              className="w-full h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Withdraw</span>
            </Button>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4 mb-2">Activities & Growth</h3>
          
          <button 
            onClick={() => router.push('/games')} 
            className="w-full h-20 rounded-[2.25rem] bg-white border border-white shadow-sm flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Games Center</span>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Lucky Spin & Daily Bets</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-purple-500 transition-colors" />
          </button>

          {userProfile?.isAgent && (
            <button 
              onClick={() => router.push('/profile/agent-center')} 
              className="w-full h-20 rounded-[2.25rem] bg-zinc-900 border border-zinc-800 shadow-xl flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/5">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-white font-black uppercase tracking-[0.1em] text-[11px] block">Agent Center</span>
                <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-tighter">Manage your official agency</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
            </button>
          )}

          {userProfile?.gender?.toLowerCase() === 'female' && !userProfile?.isAgent && (
            <button 
              onClick={() => router.push('/profile/agency')} 
              className="w-full h-20 rounded-[2.25rem] bg-white border border-white shadow-sm flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Agency Anchor</span>
                <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Join a team & earn rewards</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200" />
            </button>
          )}

          {userProfile?.isSupport && (
            <button 
              onClick={() => router.push('/support/reports')} 
              className="w-full h-20 rounded-[2.25rem] bg-red-500 border border-red-400 shadow-xl flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center relative">
                <ClipboardList className="w-6 h-6 text-white" />
                {pendingReportsCount > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-900 rounded-full border-2 border-red-500" />}
              </div>
              <div className="flex-1 text-left">
                <span className="text-white font-black uppercase tracking-[0.1em] text-[11px] block">Review Reports</span>
                <span className="text-red-100 text-[10px] font-medium uppercase tracking-tighter">Handle user complaints</span>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </button>
          )}

          {userProfile?.isCoinseller && (
            <button 
              onClick={() => router.push('/coinseller/award')} 
              className="w-full h-20 rounded-[2.25rem] bg-white border border-white shadow-sm flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Award Coins</span>
                <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Transfer coins to users</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-200" />
            </button>
          )}

          {userProfile?.isAdmin && (
            <>
              <button 
                onClick={() => router.push('/admin/award')} 
                className="w-full h-20 rounded-[2.25rem] bg-white border border-white shadow-sm flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[11px] block">Admin Coin Grant</span>
                  <span className="text-gray-400 text-[10px] font-medium uppercase tracking-tighter">Unlimited Granting Console</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-200" />
              </button>
              <button 
                onClick={() => router.push('/admin/roles')} 
                className="w-full h-20 rounded-[2.25rem] bg-zinc-900 border border-zinc-800 shadow-xl flex items-center px-6 gap-5 active:scale-[0.98] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/10">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-white font-black uppercase tracking-[0.1em] text-[11px] block">Security Panel</span>
                  <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-tighter">Manage Roles & Permissions</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-700" />
              </button>
            </>
          )}
        </div>

        {/* Utility Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4 mb-2">Preferences & Help</h3>
          
          <button 
            onClick={() => router.push('/profile/verify')} 
            className="w-full h-16 rounded-[1.75rem] bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-between px-6 shadow-sm group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm", isVerified ? "text-blue-500" : "text-gray-400")}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px]">{isVerified ? "Verified Identity" : "Verify Your Profile"}</span>
            </div>
            {isVerified ? <CheckCircle className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
          </button>

          <button 
            onClick={handleContactSupport} 
            className="w-full h-16 rounded-[1.75rem] bg-white/40 backdrop-blur-md border border-white/30 flex items-center px-6 gap-4 shadow-sm group active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm text-red-500">
              <Headset className="w-5 h-5" />
            </div>
            <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px] flex-1 text-left">Customer Care</span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>

          <button 
            onClick={() => router.push('/settings')} 
            className="w-full h-16 rounded-[1.75rem] bg-white/40 backdrop-blur-md border border-white/30 flex items-center px-6 gap-4 shadow-sm group active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm text-gray-500">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px] flex-1 text-left">App Settings</span>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </main>
    </div>
  )
}
