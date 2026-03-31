"use client"

import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import Image from "next/image"
import { Mic, CircleDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { cn } from "@/lib/utils"

const MOCK_USERS = [
  {
    id: "1",
    name: "honey cup 🌹😘",
    coins: 20,
    distance: "13.6km",
    status: "Online",
    image: PlaceHolderImages.find(i => i.id === 'user-1')?.imageUrl || "https://picsum.photos/seed/1/600/800"
  },
  {
    id: "2",
    name: "Joy Michael",
    coins: 25,
    distance: ">500km",
    status: "Active",
    image: PlaceHolderImages.find(i => i.id === 'user-4')?.imageUrl || "https://picsum.photos/seed/4/600/800"
  },
  {
    id: "3",
    name: "blessed 💕💸",
    coins: 23,
    distance: ">500km",
    status: "Online",
    image: PlaceHolderImages.find(i => i.id === 'user-5')?.imageUrl || "https://picsum.photos/seed/5/600/800"
  },
  {
    id: "4",
    name: "Camilla🌸🌸",
    coins: 23,
    distance: "13.6km",
    status: "Nearby",
    image: PlaceHolderImages.find(i => i.id === 'user-2')?.imageUrl || "https://picsum.photos/seed/2/600/800"
  }
]

export default function DiscoverPage() {
  const firestore = useFirestore()
  const profilesQuery = useMemoFirebase(() => collection(firestore, 'userProfiles'), [firestore])
  const { data: firestoreUsers } = useCollection(profilesQuery)
  
  const users = (firestoreUsers && firestoreUsers.length > 0) ? firestoreUsers.map(u => ({
    id: u.id,
    name: u.username || "Unknown",
    coins: 20,
    distance: u.location || "Nearby",
    status: "Online",
    image: (u.profilePhotoUrls && u.profilePhotoUrls[0]) || "https://picsum.photos/seed/1/600/800"
  })) : MOCK_USERS

  return (
    <div className="flex flex-col min-h-svh pb-24 bg-white">
      {/* Top Banner Area */}
      <div className="bg-maroon-800/5 pt-6 px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFCF4D] rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer h-20">
            <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-black leading-tight">Voice Chat</p>
              <p className="text-[10px] text-black/60">Connect now</p>
            </div>
          </div>
          <div className="bg-maroon-700 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer h-20">
            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center shrink-0">
              <CircleDollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-headline font-bold text-sm text-white leading-tight">Tasks</p>
              <p className="text-[10px] text-white/60">Earn rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Notification Banner */}
      <div className="px-4 py-3">
        <div className="bg-gradient-to-r from-maroon-900 to-maroon-700 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg border border-maroon-600/20">
          <div className="flex-1 text-xs">
            <p className="font-bold opacity-90"><span className="text-yellow-200">New Match</span> for <span className="text-blue-100 font-black">Explorer</span></p>
            <p className="opacity-80 leading-tight">Someone special just joined nearby!</p>
          </div>
          <Button size="sm" className="h-8 bg-white hover:bg-gray-100 text-black rounded-full font-bold text-[10px] px-4">
            View
          </Button>
        </div>
      </div>

      {/* Users Grid */}
      <main className="px-4 grid grid-cols-2 gap-4 mt-2 pb-10">
        {users.map((user) => (
          <Link key={user.id} href={`/chat/${user.id}`} className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-md bg-gray-100">
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              data-ai-hint="person portrait"
            />
            {/* Hi Badge */}
            <div className="absolute top-3 right-3 w-10 h-10 bg-maroon-800 text-white rounded-xl flex items-center justify-center font-headline font-black text-lg rotate-12 shadow-lg group-hover:rotate-0 transition-transform">
              H<span className="text-sm">i</span>
            </div>
            
            {/* Bottom Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2">
              <h3 className="text-white font-bold text-sm truncate flex items-center gap-1.5">
                {user.name} 
                <span className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-[#00D9C0] hover:bg-[#00D9C0] text-black font-black h-5 px-2 text-[9px] rounded-lg border-none shadow-sm flex items-center gap-1">
                   🪙 {user.coins}
                </Badge>
                <Badge className="bg-white/10 text-white font-medium h-5 px-2 text-[9px] rounded-lg border-none backdrop-blur-sm">
                  {user.distance}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </main>

      <Navbar />
      <style jsx global>{`
        .bg-maroon-800 { background-color: #800000; }
        .bg-maroon-700 { background-color: #990000; }
        .bg-maroon-900 { background-color: #660000; }
        .bg-maroon-800\/5 { background-color: rgba(128, 0, 0, 0.05); }
      `}</style>
    </div>
  )
}
