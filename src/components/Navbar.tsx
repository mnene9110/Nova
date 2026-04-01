"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()

  if (pathname === "/welcome" || pathname === "/login" || pathname === "/onboarding/fast" || pathname === "/onboarding/full") return null
  if (pathname.startsWith("/chat/") || (pathname.startsWith("/profile/") && pathname !== "/profile")) return null

  const navItems = [
    { icon: Home, label: "Home", href: "/discover" },
    { icon: MessageCircle, label: "Chats", href: "/chat" },
    { icon: User, label: "Profile", href: "/profile" },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
      <nav className="h-20 bg-black/80 backdrop-blur-3xl border border-white/5 rounded-full flex items-center justify-around px-6 shadow-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/discover" && (pathname === "/" || pathname === "/discover"))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "stroke-[3px]" : "stroke-[2px]")} />
              <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", isActive ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
