
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * @fileOverview Root entry point that handles initial routing.
 * Verifies profile existence before directing to dashboard or onboarding.
 */
export default function Home() {
  const { user, isUserLoading } = useUser()
  const { firestore } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading && firestore) {
      if (user) {
        // Source of truth: Check if Firestore profile exists
        getDoc(doc(firestore, "userProfiles", user.uid)).then(snap => {
          if (snap.exists()) {
            router.replace("/discover")
          } else {
            // No profile found, send to appropriate onboarding
            if (user.isAnonymous || user.email?.includes('@nova.app')) {
              router.replace("/onboarding/fast")
            } else {
              router.replace("/onboarding/full")
            }
          }
        }).catch(() => {
          // Fallback if permission error or network issue
          router.replace("/welcome")
        })
      } else {
        router.replace("/welcome")
      }
    }
  }, [user, isUserLoading, firestore, router])

  return (
    <div className="flex h-svh w-full bg-[#BAE6FD]" />
  )
}
