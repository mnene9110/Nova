
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, User, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()

  // Don't show navbar on welcome screen or login
  if (pathname === "/welcome" || pathname === "/login" || pathname === "/onboarding/fast" || pathname === "/onboarding/full") return null

  const navItems = [
    { icon: Home, label: "Home", href: "/discover" },
    { icon: MessageCircle, label: "Chat", href: "/chat", badge: "99+" },
    { icon: User, label: "Me", href: "/profile", dot: true },
  ]

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-50 flex justify-around items-center py-3 px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === "/discover" && (pathname === "/" || pathname === "/discover"))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative py-2 px-6",
              isActive ? "text-black" : "text-gray-400 hover:text-black"
            )}
          >
            {/* Active Highlight Shape (trapezoid/polygon style) */}
            {isActive && (
              <div className="absolute inset-0 bg-[#D4F835] -z-10 rounded-[1.5rem] scale-90" 
                   style={{ clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)' }} />
            )}
            
            <div className="relative">
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
              {item.badge && (
                <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white min-w-[1.4rem] h-5 flex justify-center items-center shadow-sm">
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
            <span className={cn("text-[10px] font-black tracking-tight", isActive ? "text-black" : "text-gray-400")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
