
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, User, Zap, Orbit, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()

  // Don't show navbar on welcome screen or login
  if (pathname === "/welcome" || pathname === "/login") return null

  const navItems = [
    { icon: Home, label: "Home", href: "/discover" },
    { icon: Orbit, label: "Moment", href: "/moment" },
    { icon: MessageCircle, label: "Chat", href: "/chat", badge: "99+" },
    { icon: User, label: "Me", href: "/profile", dot: true },
  ]

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-border flex justify-around items-center py-2 px-2 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === "/discover" && pathname === "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300 relative py-1 px-4 rounded-2xl",
              isActive ? "text-black bg-[#E9FF97]/60" : "text-muted-foreground hover:text-black"
            )}
          >
            <div className="relative">
              <Icon className={cn("w-7 h-7", isActive && "fill-current")} />
              {item.badge && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[1.25rem] text-center">
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
