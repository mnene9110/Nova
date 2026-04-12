
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useFirebase, useUser } from "@/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"

export function Navbar() {
  const pathname = usePathname()
  const { firestore } = useFirebase()
  const { user: currentUser } = useUser()
  const [totalUnread, setTotalUnread] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!firestore || !currentUser) return

    const chatsQuery = query(
      collection(firestore, "chats"),
      where("participants", "array-contains", currentUser.uid)
    )

    return onSnapshot(chatsQuery, (snapshot) => {
      let count = 0
      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const unread = data[`unreadCount_${currentUser.uid}`] || 0
        count += unread
      })
      setTotalUnread(count)
    })
  }, [firestore, currentUser])

  const hiddenRoutes = [
    "/welcome",
    "/login",
    "/onboarding/fast",
    "/onboarding/full",
    "/recharge",
    "/settings",
    "/admin",
    "/support",
    "/task-center",
    "/games",
    "/mystery-note",
    "/coinseller/award",
    "/admin/award"
  ]
  
  const shouldHide = 
    hiddenRoutes.some(route => pathname?.startsWith(route)) || 
    pathname?.startsWith("/chat/") || 
    (pathname?.startsWith("/profile/") && pathname !== "/profile") ||
    pathname === "/"

  if (!mounted || shouldHide) return null

  const navItems = [
    { label: "Home", href: "/discover", icon: "/home.png" },
    { label: "Chats", href: "/chat", icon: "/chat.png", badge: totalUnread },
    { label: "You", href: "/profile", icon: "/me.png" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-white/20 bg-white/80 backdrop-blur-2xl">
      <nav className="h-14 w-full flex items-center justify-around px-4 overflow-hidden max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 flex-1 relative h-full",
                isActive ? "text-[#111FA2]" : "text-gray-400"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all relative flex items-center justify-center",
                isActive ? "scale-110" : "grayscale opacity-40"
              )}>
                <div className="relative w-7 h-7">
                  <Image 
                    src={item.icon} 
                    alt={item.label} 
                    fill 
                    className="object-contain"
                  />
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-black text-white border-2 border-white shadow-md">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
