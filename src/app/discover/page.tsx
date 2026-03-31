
"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import Image from "next/image"
import { Mic, CircleDollarSign, Loader2, Sparkles, TrendingUp, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCollection, useFirebase, useMemoFirebase, useUser } from "@/firebase"
import { collection } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { cn } from "@/lib/utils"

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'nearby'>('recommend')
  const { firestore, database } = useFirebase()
  const { user: currentUser } = useUser()
  const router = useRouter()
  const [presenceData, setPresenceData] = useState<Record<string, boolean>>({})
  
  const profilesQuery = useMemoFirebase(() => collection(firestore, 'userProfiles'), [firestore])
  const { data: firestoreUsers, isLoading } = useCollection(profilesQuery)
  
  // Presence Listener for all users
  useEffect(() => {
    if (!database) return
    const presenceRef = ref(database, 'users')
    return onValue(presenceRef, (snapshot) => {
      const users = snapshot.val()
      if (users) {
        const statuses: Record<string, boolean> = {}
        Object.entries(users).forEach(([uid, data]: [string, any]) => {
          statuses[uid] = !!data.presence?.online
        })
        setPresenceData(statuses)
      }
    })
  }, [database])

  // Filter out the current user from the discovery list
  const filteredUsers = firestoreUsers?.filter(u => u.id !== currentUser?.uid) || []

  const users = filteredUsers.map(u => ({
    id: u.id,
    name: u.username || "MatchFlow User",
    coins: 20,
    distance: u.location || "Nearby",
    isOnline: !!presenceData[u.id],
    image: (u.profilePhotoUrls && u.profilePhotoUrls[0]) || `https://picsum.photos/seed/${u.id}/600/800`
  }))

  const displayUsers = activeTab === 'nearby' 
    ? users.filter(u => u.distance.toLowerCase().includes('km') || u.distance.toLowerCase().includes('nearby'))
    : users;

  return (
    <div className="flex flex-col min-h-svh pb-24 bg-transparent">
      {/* Dynamic Top Banner Area */}
      <div className="pt-8 px-4 pb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-maroon-900 rounded-[2.5rem] p-6 shadow-2xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer h-36 flex flex-col justify-center border border-white/20">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-xl">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-headline font-black text-lg text-white leading-tight">Voice Chat</p>
                <div className="flex items-center gap-1 mt-1">
                   <TrendingUp className="w-3 h-3 text-accent" />
                   <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Hot Now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group overflow-hidden bg-gradient-to-br from-[#FFCF4D] to-[#FFB13B] rounded-[2.5rem] p-6 shadow-2xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer h-36 flex flex-col justify-center border border-white/30">
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-black/5 rounded-full blur-3xl" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 bg-black/10 backdrop-blur-lg rounded-full flex items-center justify-center shrink-0 border border-black/10 shadow-lg">
                <CircleDollarSign className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="font-headline font-black text-lg text-black leading-tight">Daily Gold</p>
                <div className="flex items-center gap-1 mt-1">
                   <Sparkles className="w-3 h-3 text-primary" />
                   <p className="text-[9px] text-black/60 font-black uppercase tracking-widest">Earn Free</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="px-6 flex items-center gap-8 mb-4 sticky top-0 bg-transparent backdrop-blur-md z-20 py-4">
        <button 
          onClick={() => setActiveTab('recommend')}
          className="relative group pb-1"
        >
          <span className={cn(
            "text-3xl font-logo transition-all duration-300",
            activeTab === 'recommend' ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
          )}>
            Recommend
          </span>
          {activeTab === 'recommend' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full animate-in fade-in slide-in-from-left-2 duration-300" />
          )}
        </button>

        <button 
          onClick={() => setActiveTab('nearby')}
          className="relative group pb-1"
        >
          <span className={cn(
            "text-3xl font-logo transition-all duration-300",
            activeTab === 'nearby' ? "text-primary scale-105" : "text-gray-400 hover:text-gray-600"
          )}>
            Nearby
          </span>
          {activeTab === 'nearby' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary rounded-full animate-in fade-in slide-in-from-right-2 duration-300" />
          )}
        </button>
      </div>

      {/* Discovery Grid */}
      <main className="px-4 grid grid-cols-2 gap-4 mt-2 pb-10 flex-1">
        {isLoading ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm font-black text-gray-400 animate-pulse uppercase tracking-widest">Connecting flows...</p>
          </div>
        ) : displayUsers.length > 0 ? (
          displayUsers.map((user) => (
            <div 
              key={user.id} 
              className="group relative aspect-[3/4.2] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-50 border-4 border-white/20 transition-all hover:shadow-primary/20"
            >
              {/* Profile Background Link */}
              <Link href={`/profile/${user.id}`} className="absolute inset-0 z-0 cursor-pointer">
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                  data-ai-hint="nature river"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
              </Link>

              {/* Isolated Chat Action */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/chat/${user.id}`);
                }}
                className="absolute top-4 right-4 w-12 h-12 bg-primary/95 backdrop-blur-md text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-primary hover:scale-110 active:scale-90 transition-all z-10 border border-white/20 group-hover:rotate-6"
              >
                <MessageCircle className="w-6 h-6 fill-white" />
              </button>
              
              <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-2 pointer-events-none z-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-white font-black text-lg truncate flex items-center gap-2 max-w-[80%] drop-shadow-md">
                    {user.name} 
                  </h3>
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-shadow duration-500 ring-2 ring-white/20",
                    user.isOnline 
                      ? "bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" 
                      : "bg-gray-400 shadow-none"
                  )} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black h-7 px-3 text-[10px] rounded-xl flex items-center gap-1.5 shadow-xl">
                     🪙 {user.coins}
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black h-7 px-3 text-[10px] rounded-xl shadow-xl">
                    {user.distance}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-24 space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner border border-gray-100">
               <TrendingUp className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No flows found in this area</p>
          </div>
        )}
      </main>

      <Navbar />
    </div>
  )
}
