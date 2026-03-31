"use client"

import { Navbar } from "@/components/Navbar"
import { 
  Settings, 
  ChevronRight, 
  Copy, 
  Coins, 
  Crown, 
  ClipboardList, 
  Wallet, 
  Store, 
  ShieldCheck, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Headset, 
  MessageSquareText,
  Gamepad2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import Image from "next/image"

export default function ProfilePage() {
  const stats = [
    { label: "Friends", value: 0 },
    { label: "Following", value: 0 },
    { label: "Followers", value: 18 },
    { label: "Visitors", value: "11,293", hasDot: true },
  ]

  const games = [
    { name: "DeepSea Treasure", image: "https://picsum.photos/seed/deepsea/200/150", hint: "underwater treasure" },
    { name: "Gates Of Olympus", image: "https://picsum.photos/seed/olympus/200/150", hint: "greek god" },
    { name: "Mr. Rich", image: "https://picsum.photos/seed/rich/200/150", hint: "wealthy man" },
  ]

  const actions = [
    { label: "Tasks", icon: ClipboardList, color: "text-green-500", bg: "bg-green-50" },
    { label: "Income", icon: Wallet, color: "text-lime-600", bg: "bg-lime-50" },
    { label: "Store", icon: Store, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Aristocracy", icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  const otherTools = [
    { label: "Bag", icon: Briefcase },
    { label: "Level", icon: TrendingUp },
    { label: "Badge", icon: Award },
    { label: "Certified", icon: ShieldCheck },
    { label: "Service", icon: Headset },
    { label: "Feedback", icon: MessageSquareText },
    { label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex flex-col min-h-svh bg-white pb-24">
      {/* Header Area */}
      <header className="relative pt-12 pb-8 px-6 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-[#D4F835] -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-headline text-black">MCC🤨</h1>
              <ChevronRight className="w-5 h-5 text-black/60" />
            </div>
            
            <div className="flex gap-2">
              <span className="bg-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black text-black italic backdrop-blur-sm">SVIP1</span>
              <span className="bg-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black text-black italic backdrop-blur-sm">V VIP4</span>
              <span className="bg-black/10 px-2 py-0.5 rounded-lg text-[9px] font-black text-black italic backdrop-blur-sm">✦ 16.</span>
            </div>

            <div className="flex items-center gap-2 text-black/40">
              <span className="text-xs font-bold tracking-tight">ID:667541426</span>
              <div className="p-1 hover:bg-black/5 rounded-md transition-colors cursor-pointer">
                <Copy className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <Avatar className="w-20 h-20 border-4 border-white shadow-2xl ring-1 ring-black/5">
            <AvatarImage src={PlaceHolderImages.find(i => i.id === 'user-1')?.imageUrl} className="object-cover" />
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between mt-8 pr-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-black">{stat.value}</span>
                {stat.hasDot && <div className="w-2 h-2 bg-red-500 rounded-full border-2 border-[#D4F835]" />}
              </div>
              <span className="text-[10px] text-black/50 font-black uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-6 space-y-8">
        {/* Wallet Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#A3E635] rounded-3xl p-5 flex items-center gap-4 shadow-lg shadow-lime-100 hover:scale-[1.02] transition-transform cursor-pointer border border-white/20">
            <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">98</span>
          </div>
          <div className="bg-white rounded-3xl p-5 flex items-center justify-center shadow-lg shadow-gray-100 hover:scale-[1.02] transition-transform cursor-pointer border border-gray-50">
             <span className="text-2xl font-black text-[#D4F835] italic tracking-tighter">VIP4</span>
          </div>
        </div>

        {/* Recommended Games */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline font-black text-lg">Recommended Games</h2>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {games.map((game) => (
              <div key={game.name} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                  <Image src={game.image} alt={game.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" data-ai-hint={game.hint} />
                </div>
                <span className="text-[10px] font-black text-gray-700 text-center leading-tight px-1">{game.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Icon Grid (Action Center) */}
        <section className="bg-gray-50/50 rounded-[2.5rem] p-6 grid grid-cols-4 gap-y-8">
          {actions.map((action) => (
            <div key={action.label} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className={`w-12 h-12 ${action.bg} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-[11px] font-black text-gray-500">{action.label}</span>
            </div>
          ))}
        </section>

        {/* Other Tools */}
        <section className="space-y-6 pb-6">
          <h2 className="font-headline font-black text-lg px-1">Other Tools</h2>
          <div className="grid grid-cols-4 gap-y-8">
            {otherTools.map((tool) => (
              <div key={tool.label} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center rounded-full group-hover:bg-gray-50 transition-colors">
                  <tool.icon className="w-6 h-6 text-gray-400 group-hover:text-black transition-colors" />
                </div>
                <span className="text-[11px] font-black text-gray-400 group-hover:text-black text-center transition-colors">{tool.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 relative group cursor-pointer">
               <div className="bg-blue-600 rounded-2xl p-2.5 shadow-xl shadow-blue-100 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="w-6 h-6 text-white" />
               </div>
               <span className="absolute -bottom-1 bg-[#D4F835] text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm text-black">PLAY</span>
            </div>
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  )
}
