
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"

export default function Home() {
  const { user, isUserLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Wait for the auth state to be determined
    if (!isUserLoading) {
      if (user) {
        // User is already logged in, skip welcome and go to discover
        router.replace("/discover")
      } else {
        // No user found, take them to the welcome entry point
        router.replace("/welcome")
      }
    }
  }, [user, isUserLoading, router])

  // Show a blank screen during the routing decision to prevent flickering
  return (
    <div className="flex h-svh bg-white" />
  )
}
