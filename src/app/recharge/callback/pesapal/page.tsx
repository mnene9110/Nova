"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * @fileOverview Deprecated PesaPal Callback page.
 * Users are now routed through Paystack.
 */

export default function PesapalCallbackPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/recharge")
  }, [router])

  return null
}
