"use client"

import { Navbar } from "@/components/Navbar"
import { 
  ChevronRight, 
  Copy, 
  Coins, 
  ClipboardList, 
  ShieldCheck, 
  Headset, 
  Loader2,
  Settings as SettingsIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { user: currentUser, isUserLoading } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, "userProfiles", currentUser.uid);
  }, [firestore, currentUser])

  const coinAccountRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, "coinAccounts", currentUser.uid);
  }, [firestore, currentUser])

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef)
  const { data: coinAccount, isLoading: isCoinsLoading } = useDoc(coinAccountRef)

  const displayNumericId = userProfile?.numericId || currentUser?.uid.slice(-8).toUpperCase();

  const copyId = () => {
    if (displayNumericId) {
      navigator.clipboard.writeText(displayNumericId.toString());
      toast({
        title: "Copied!",
        description: "User ID copied.",
      });
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-svh bg-white">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  const userImage = (userProfile?.profilePhotoUrls && userProfile?.profilePhotoUrls[0]) || `https://picsum.photos/seed/${currentUser?.uid}/200/200`

  const otherTools = [
    { label: "Certified", icon: ShieldCheck },
    { label: "Service", icon: Headset },
    { label: "Settings", icon: SettingsIcon, href: "/settings" },
  ]

  return (
    <div className="flex flex-col min-h-svh bg-slate-50/50 pb-20">
      <header className="relative pt-12 pb-10 px-6 overflow-hidden bg-moving-gradient rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex justify-between items-center relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-headline text-white drop-shadow-sm">{userProfile?.username || "Guest"}</h1>
              <div className="bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/20">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-white/60 bg-black/10 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <span className="text-[10px] font-black tracking-widest uppercase">ID:{displayNumericId}</span>
              <button 
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                onClick={copyId}
              >
                <Copy className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Avatar className="w-20 h-20 shadow-2xl border-4 border-white/30 p-0.5 bg-white/10">
              <AvatarImage src={userImage} className="object-cover rounded-full" />
              <AvatarFallback className="bg-primary text-white font-black text-2xl">{userProfile?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-[#800000] z-20" />
          </div>
        </div>
      </header>

      <main className="px-5 -mt-6 relative z-20 space-y-6">
        <div 
          className="bg-white rounded-[2rem] p-5 flex items-center justify-between shadow-xl border border-gray-100 active:scale-[0.98] transition-all cursor-pointer group"
          onClick={() => router.push('/recharge')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-moving-gradient rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">My Balance</span>
              <span className="text-3xl font-black text-gray-900 leading-none mt-1">
                {isCoinsLoading ? "..." : (coinAccount?.balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="bg-primary/5 p-3 rounded-2xl">
            <ChevronRight className="w-5 h-5 text-primary" />
          </div>
        </div>

        <section className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-50">
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100 group-hover:bg-primary/5 transition-colors">
                <ClipboardList className="w-7 h-7 text-primary" />
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">My Tasks</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => router.push('/settings')}>
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner border border-gray-100 group-hover:bg-primary/5 transition-colors">
                <SettingsIcon className="w-7 h-7 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Settings</span>
            </div>
          </div>
        </section>

        <section className="space-y-4 px-2">
          <h2 className="font-headline font-black text-base text-gray-900 flex items-center gap-2">
            Other Tools
            <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent" />
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {otherTools.map((tool) => (
              <div 
                key={tool.label} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => tool.href && router.push(tool.href)}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 active:bg-primary/5 transition-all">
                  <tool.icon className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[9px] font-black text-gray-400 text-center uppercase tracking-tight">{tool.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  )
}
