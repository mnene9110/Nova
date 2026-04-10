
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * @fileOverview Splash screen and initial routing logic.
 */
export default function Home() {
  const { user, isUserLoading } = useUser()
  const { firestore } = useFirebase()
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      if (!isUserLoading && firestore) {
        // Minimum splash time for branding
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (user) {
          try {
            const snap = await getDoc(doc(firestore, "userProfiles", user.uid))
            if (snap.exists()) {
              router.replace("/discover")
            } else {
              if (user.isAnonymous || user.email?.includes('@nova.app')) {
                router.replace("/onboarding/fast")
              } else {
                router.replace("/onboarding/full")
              }
            }
          } catch (e) {
            router.replace("/welcome")
          }
        } else {
          router.replace("/welcome")
        }
      }
    }
    checkUser()
  }, [user, isUserLoading, firestore, router])

  return (
    <div className="flex h-svh w-full bg-[#111FA2] items-center justify-center overflow-hidden">
      <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center gap-4">
        <h1 className="text-5xl font-logo text-white drop-shadow-2xl">Matchflow</h1>
        <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[progress_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0; transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
