
"use client"

import { useState } from "react"
import { 
  ChevronRight, 
  Copy, 
  Coins, 
  Headset, 
  Pencil,
  ShieldCheck,
  Settings as SettingsIcon,
  ShieldAlert,
  Loader2,
  CheckCircle
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const [isFindingSupport, setIsFindingSupport] = useState(false)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, "userProfiles", currentUser.uid);
  }, [firestore, currentUser])

  const { data: userProfile, isLoading } = useDoc(userRef)

  const displayNumericId = userProfile?.numericId || "";

  const copyId = () => {
    if (displayNumericId) {
      navigator.clipboard.writeText(displayNumericId.toString());
      toast({
        title: "Copied!",
        description: "User ID copied.",
      });
    }
  }

  const handleUpdateAvatar = async () => {
    if (!currentUser || !firestore || isUpdatingAvatar) return
    setIsUpdatingAvatar(true)
    
    try {
      // Simulate changing avatar by picking a new seed for picsum
      const newSeed = Math.floor(Math.random() * 1000)
      const newUrl = `https://picsum.photos/seed/${newSeed}/600/800`
      
      const userDocRef = doc(firestore, "userProfiles", currentUser.uid)
      await updateDocumentNonBlocking(userDocRef, {
        profilePhotoUrls: [newUrl],
        // Reset verification when avatar changes
        isVerified: false,
        updatedAt: new Date().toISOString()
      })
      
      toast({
        title: "Avatar Updated",
        description: "Verification status has been reset. Please verify again to regain trust.",
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update avatar." })
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  const handleContactSupport = async () => {
    if (!firestore || isFindingSupport) return
    setIsFindingSupport(true)
    
    try {
      const q = query(
        collection(firestore, "userProfiles"), 
        where("isSupport", "==", true),
        limit(1)
      )
      const snap = await getDocs(q)
      
      if (snap.empty) {
        toast({
          variant: "destructive",
          title: "Support Unavailable",
          description: "No support agents are currently available. Please try again later."
        })
      } else {
        const supportId = snap.docs[0].id
        router.push(`/chat/${supportId}`)
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not connect to support." })
    } finally {
      setIsFindingSupport(false)
    }
  }

  const userImage = (userProfile?.profilePhotoUrls && userProfile?.profilePhotoUrls[0]) || ""
  const darkMaroon = "bg-[#5A1010]";
  const isVerified = !!userProfile?.isVerified

  return (
    <div className="flex flex-col min-h-svh bg-transparent text-gray-900 pb-24 transition-opacity duration-300">
      <header className="flex flex-col items-center pt-12 pb-8 px-6">
        <div className="relative mb-6">
          <Avatar className="w-28 h-28 shadow-lg bg-gray-50 ring-4 ring-white/20">
            {userImage && <AvatarImage src={userImage} className="object-cover" />}
            <AvatarFallback className="bg-primary text-white font-black text-2xl">
              {userProfile?.username?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          {!isLoading && (
            <button 
              onClick={handleUpdateAvatar}
              disabled={isUpdatingAvatar}
              className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-lg active:scale-90 transition-transform disabled:opacity-50"
            >
              {isUpdatingAvatar ? <Loader2 className="w-3 h-3 animate-spin text-white" /> : <Pencil className="w-3.5 h-3.5 text-white" />}
            </button>
          )}
          {isVerified && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
               <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/10" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-2xl font-black tracking-tight text-center">
            {userProfile?.username || ""}
          </h1>
          {isVerified && <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500/10" />}
        </div>

        {displayNumericId && (
          <button 
            onClick={copyId}
            className="flex items-center gap-2 px-5 py-2 bg-white/40 backdrop-blur-md border border-white/30 rounded-full active:bg-white/60 transition-colors"
          >
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-[0.2em]">ID: {displayNumericId}</span>
            <Copy className="w-3 h-3 text-green-500/50" />
          </button>
        )}
      </header>

      <main className="px-6 space-y-3">
        <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Wallet Balance</span>
            </div>
            <span className="text-2xl font-black text-gray-900">
              {userProfile?.coinBalance?.toLocaleString() || "0"}
            </span>
          </div>
          
          <Button 
            onClick={() => router.push('/recharge')}
            className={cn("w-full h-14 rounded-[1.75rem] text-white font-black uppercase tracking-[0.1em] text-xs shadow-lg shadow-primary/20", darkMaroon)}
          >
            Recharge
          </Button>
        </div>

        {!isLoading && userProfile?.isAdmin && (
          <div className="pt-2">
            <button 
              onClick={() => router.push('/admin/roles')}
              className="w-full h-16 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex items-center px-6 gap-4 active:scale-[0.98] transition-all shadow-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-white font-black uppercase tracking-[0.1em] text-[10px] block">Admin Panel</span>
                <span className="text-zinc-500 text-[11px] font-bold">Manage Roles & Privileges</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-2">
          <button 
            onClick={() => router.push('/profile/verify')}
            className="w-full h-14 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-between px-6 active:bg-white/60 transition-all"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className={cn("w-4 h-4", isVerified ? "text-blue-500" : "text-gray-400")} />
              <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px]">
                {isVerified ? "Identity Verified" : "Verify Identity"}
              </span>
            </div>
            {isVerified ? (
              <CheckCircle className="w-4 h-4 text-blue-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300" />
            )}
          </button>

          <button 
            onClick={handleContactSupport}
            disabled={isFindingSupport}
            className="w-full h-14 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center gap-3 active:bg-white/60 transition-all disabled:opacity-50"
          >
            {isFindingSupport ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Headset className="w-4 h-4 text-primary" />}
            <span className="text-gray-900 font-black uppercase tracking-[0.1em] text-[10px]">Customer Support</span>
          </button>
          
          <button 
            onClick={() => router.push('/settings')}
            className="w-full h-14 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center gap-3 active:bg-white/60 transition-all"
          >
            <SettingsIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 font-black uppercase tracking-[0.1em] text-[10px]">Settings</span>
          </button>
        </div>
      </main>
    </div>
  )
}
