"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

/**
 * @fileOverview Root entry point that handles initial routing.
 * Updated to Pastel Blue fallback.
 */
export default function Home() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace("/discover")
      } else {
        router.replace("/welcome")
      }
    }
  }, [user, isUserLoading, router])

  return (
    <div className="flex h-svh w-full bg-[#BAE6FD]" />
  )
}