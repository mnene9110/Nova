
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirebase } from "@/firebase"
import { doc, getDoc } from "firebase/firestore"

/**
 * @fileOverview Native Splash screen and initial routing logic.
 */
export default function Home() {
  const { user, isUserLoading } = useUser()
  const { firestore } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      if (!isUserLoading && firestore) {
        // Minimum splash time for premium branding feel
        await new Promise(resolve => setTimeout(resolve, 2000))
        
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
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000">
        <h1 className="text-6xl font-logo text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">Matchflow</h1>
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-white animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <style jsx global>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
