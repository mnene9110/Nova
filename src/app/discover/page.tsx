
"use client"

import { useState } from "react"
import { Navbar } from "@/components/Navbar"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import Image from "next/image"
import { Search, Mic, Gamepad2, CircleDollarSign, Bell, MessageCircle } from "lucide-react"
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
    status: "No",
    image: PlaceHolderImages.find(i => i.id === 'user-1')?.imageUrl || "https://picsum.photos/seed/1/600/800"
  },
  {
    id: "2",
    name: "Joy Michael",
    coins: 25,
    distance: ">500km",
    status: "Never",
    image: PlaceHolderImages.find(i => i.id === 'user-4')?.imageUrl || "https://picsum.photos/seed/4/600/800"
  },
  {
    id: "3",
    name: "blessed 💕💸",
    coins: 23,
    distance: ">500km",
    status: "Gemini",
    image: PlaceHolderImages.find(i => i.id === 'user-5')?.imageUrl || "https://picsum.photos/seed/5/600/800"
  },
  {
    id: "4",
    name: "Camilla🌸🌸",
    coins: 23,
    distance: "13.6km",
    status: "Capricorn",
    image: PlaceHolderImages.find(i => i.id === 'user-2')?.imageUrl || "https://picsum.photos/seed/2/600/800"
  }
]

export default function DiscoverPage() {
  const firestore = useFirestore()
  const profilesQuery = useMemoFirebase(() => collection(firestore, 'userProfiles'), [firestore])
  const { data: firestoreUsers, isLoading } = useCollection(profilesQuery)
  
  const [activeTab, setActiveTab] = useState("Recommend")

  // Use Firestore data if available, otherwise fallback to mock
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
      {/* Top Background Banner Area */}
      <div className="bg-[#E9FF97]/40 pt-4 px-4 pb-2">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#FFCF4D] rounded-2xl p-3 flex flex-col items-center justify-between aspect-square shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-black" />
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-sm text-black leading-tight">Voice Chat</p>
              <p className="text-[10px] text-black/60">Voice chat now</p>
            </div>
          </div>
          <div className="bg-[#A0AFFF] rounded-2xl p-3 flex flex-col items-center justify-between aspect-square shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-black" />
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-sm text-black leading-tight">Game Center</p>
              <p className="text-[10px] text-black/60">Have fun</p>
            </div>
          </div>
          <div className="bg-[#97E797] rounded-2xl p-3 flex flex-col items-center justify-between aspect-square shadow-sm">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CircleDollarSign className="w-6 h-6 text-black" />
            </div>
            <div className="text-center">
              <p className="font-headline font-bold text-sm text-black leading-tight">Tasks Center</p>
              <p className="text-[10px] text-black/60">Earn coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Notification Banner */}
      <div className="px-4 py-2">
        <div className="bg-gradient-to-r from-[#69EAFF] to-[#A297FF] rounded-2xl p-3 flex items-center justify-between text-white shadow-md">
          <div className="flex-1 text-xs">
            <p className="font-bold opacity-90"><span className="text-yellow-200">13:47 emeka</span> to <span className="text-blue-200">Mystery man</span></p>
            <p className="opacity-80 leading-tight">Completed my wish list <span className="font-bold">Antique Telephonex5</span></p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Locked 10s</span>
            <Button size="sm" className="h-7 bg-[#E9FF97] hover:bg-[#D9EF87] text-black rounded-full font-bold text-[10px] px-3">
              View TV wall
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended / Newcomer Tabs */}
      <div className="sticky top-0 z-20 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {["Recommend", "Newcomer", "Nearby"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative text-lg font-headline font-bold transition-all",
                activeTab === tab ? "text-black" : "text-muted-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute -bottom-1 left-0 right-0 h-1.5 bg-[#E9FF97] -z-10 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-black" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </div>
          <Search className="w-6 h-6 text-black" />
        </div>
      </div>

      {/* Users Grid */}
      <main className="px-4 grid grid-cols-2 gap-3 pb-10">
        {users.map((user) => (
          <Link key={user.id} href={`/chat/${user.id}`} className="group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-sm">
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hi Badge */}
            <div className="absolute top-2 right-2 w-10 h-10 bg-[#E9FF97] rounded-2xl flex items-center justify-center font-headline font-black text-lg rotate-12 shadow-md">
              H<span className="text-sm">i</span>
            </div>
            
            {/* Bottom Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex flex-col gap-1.5">
              <h3 className="text-white font-bold text-sm flex items-center gap-1">
                {user.name} 👤
              </h3>
              <div className="flex flex-wrap gap-1">
                <Badge className="bg-[#00D9C0] hover:bg-[#00C9B0] text-black font-bold h-5 px-1.5 text-[10px] rounded-md gap-0.5 border-none">
                  <div className="w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#FFCF4D] rounded-full" />
                  </div>
                  {user.coins}
                </Badge>
                <Badge className="bg-[#E9FF97] hover:bg-[#D9EF87] text-black font-bold h-5 px-1.5 text-[10px] rounded-md border-none">
                  {user.distance}
                </Badge>
                <Badge className="bg-black/60 text-white font-medium h-5 px-1.5 text-[10px] rounded-md border-none">
                  {user.status}
                </Badge>
              </div>
            </div>
          </Link>
        ))}
      </main>

      {/* Floating Game Button */}
      <div className="fixed bottom-24 right-4 z-30">
        <button className="relative w-16 h-16 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center border-2 border-primary/20">
          <div className="absolute -top-4 -right-2">
             <div className="bg-[#A0AFFF] p-2 rounded-xl shadow-lg border-2 border-white rotate-12">
               <Gamepad2 className="w-6 h-6 text-white" />
             </div>
          </div>
          <span className="mt-4 font-bold text-xs bg-[#E9FF97] px-2 py-0.5 rounded-full">Game</span>
        </button>
      </div>

      <Navbar />
    </div>
  )
}
