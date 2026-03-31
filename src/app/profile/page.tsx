
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import Image from "next/image"

export default function ProfilePage() {
  const stats = [
    { label: "Friends", value: 0 },
    { label: "Following", value: 0 },
    { label: "Followers", value: 18 },
    { label: "Visitors", value: "11293", hasDot: true },
  ]

  const games = [
    { name: "DeepSea Treasure", image: "https://picsum.photos/seed/deepsea/200/150", hint: "underwater treasure" },
    { name: "Gates Of Olympus", image: "https://picsum.photos/seed/olympus/200/150", hint: "greek god" },
    { name: "Mr. Rich", image: "https://picsum.photos/seed/rich/200/150", hint: "wealthy man" },
  ]

  const actions = [
    { label: "Tasks", icon: ClipboardList, color: "text-green-500", bg: "bg-green-50" },
    { label: "Income", icon: Wallet, color: "text-lime-500", bg: "bg-lime-50" },
    { label: "Store", icon: Store, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Aristocracy", icon: Crown, color: "text-lime-600", bg: "bg-lime-100" },
  ]

  const otherTools = [
    { label: "Bag", icon: Briefcase },
    { label: "Level", icon: TrendingUp },
    { label: "Badge", icon: Award },
    { label: "Certified", icon: ShieldCheck },
    { label: "Customer service", icon: Headset },
    { label: "User Feedback", icon: MessageSquareText },
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-headline text-black">MCC🤨</h1>
              <ChevronRight className="w-5 h-5 text-black" />
            </div>
            
            <div className="flex gap-1.5">
              <span className="bg-primary/30 px-1.5 py-0.5 rounded text-[8px] font-black text-black italic">SVIP1</span>
              <span className="bg-purple-500/30 px-1.5 py-0.5 rounded text-[8px] font-black text-black italic">V VIP4</span>
              <span className="bg-blue-500/30 px-1.5 py-0.5 rounded text-[8px] font-black text-black italic">✦ 16.</span>
            </div>

            <div className="flex items-center gap-2 text-black/40">
              <span className="text-xs font-medium">ID:667541426</span>
              <Copy className="w-3 h-3" />
            </div>
          </div>

          <Avatar className="w-20 h-20 border-4 border-white/50 shadow-xl">
            <AvatarImage src={PlaceHolderImages.find(i => i.id === 'user-1')?.imageUrl} className="object-cover" />
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between mt-8 pr-12">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <div className="flex items-center gap-0.5">
                <span className="text-lg font-black text-black">{stat.value}</span>
                {stat.hasDot && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
              </div>
              <span className="text-[10px] text-black/40 font-bold">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-6 space-y-8">
        {/* Wallet Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#A3E635] rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">98</span>
          </div>
          <div className="bg-gradient-to-br from-[#E2D1C3] to-[#F5E3D6] rounded-3xl p-5 flex items-center justify-center shadow-sm hover:scale-[1.02] transition-transform cursor-pointer">
             <span className="text-2xl font-black text-white italic tracking-tighter opacity-80">VIP4</span>
          </div>
        </div>

        {/* Recommended Games */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg">Recommended Games</h2>
            <ChevronRight className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {games.map((game) => (
              <div key={game.name} className="flex flex-col items-center gap-2">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm">
                  <Image src={game.image} alt={game.name} fill className="object-cover" data-ai-hint={game.hint} />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight px-1">{game.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Icon Grid (Action Center) */}
        <section className="grid grid-cols-4 gap-y-8 py-4">
          {actions.map((action) => (
            <div key={action.label} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 ${action.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-[11px] font-bold text-gray-500">{action.label}</span>
            </div>
          ))}
        </section>

        {/* Other Tools */}
        <section className="space-y-6">
          <h2 className="font-headline font-bold text-lg">Other</h2>
          <div className="grid grid-cols-4 gap-y-8">
            {otherTools.map((tool) => (
              <div key={tool.label} className="flex flex-col items-center gap-2">
                <tool.icon className="w-6 h-6 text-black/80" />
                <span className="text-[11px] font-bold text-gray-500 text-center">{tool.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 relative">
               <div className="bg-blue-500 rounded-2xl p-2.5 shadow-lg shadow-blue-200">
                  <Gamepad2 className="w-6 h-6 text-white" />
               </div>
               <span className="absolute -bottom-1 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">Game</span>
            </div>
          </div>
        </section>
      </main>

      <Navbar />
    </div>
  )
}
