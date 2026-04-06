"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * @fileOverview This page is now deprecated. Functional logic has been moved 
 * to the main /recharge page for a more streamlined user experience.
 */
export default function DeprecatedPaymentMethodPage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect back to the main recharge page
    router.replace("/recharge")
  }, [router])

  return (
    <div className="flex h-svh items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )
}
