"use client"

import { useEffect, useRef, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useFirebase, useUser, useMemoFirebase } from "@/firebase"
import { doc, runTransaction, serverTimestamp } from "firebase/firestore"
import { getTransactionStatus } from "@/app/actions/pesapal"
import { useToast } from "@/hooks/use-toast"

function PesapalCallbackContent({ searchParams }: { searchParams: Promise<any> }) {
  const params = use(searchParams)
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()
  const processedRef = useRef(false)

  const trackingId = params.OrderTrackingId
  const merchantRefId = params.OrderMerchantReference

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, "coinAccounts", currentUser.uid);
  }, [firestore, currentUser]);

  useEffect(() => {
    // If no tracking ID present (abandoned signal), redirect to recharge
    if (!trackingId) {
      router.replace("/recharge");
      return;
    }

    if (!currentUser || !firestore || !userDocRef || processedRef.current) return;

    const handleVerification = async () => {
      processedRef.current = true;
      
      try {
        const statusData = await getTransactionStatus(trackingId);
        
        if (statusData.payment_status_description === "Completed") {
          // Perform atomic update to add coins
          await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("Account not found");
            
            // In a real app, you'd verify the amount from PesaPal
            // For now, we use a default or metadata if available
            const currentBalance = userDoc.data().balance || 0;
            const newBalance = currentBalance + 1000; // Example
            
            transaction.update(userDocRef, {
              balance: newBalance,
              updatedAt: new Date().toISOString()
            });
          });

          toast({ title: "Success", description: "Payment completed successfully!" });
          router.replace("/recharge?status=success");
        } else {
          toast({ variant: "destructive", title: "Pending", description: "Payment is still being processed." });
          router.replace("/recharge?status=pending");
        }
      } catch (error) {
        console.error("Verification error:", error);
        router.replace("/recharge?status=error");
      }
    };

    handleVerification();
  }, [trackingId, currentUser, firestore, userDocRef, router, toast]);

  return (
    <div className="min-h-svh bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center animate-pulse">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-3xl -z-10" />
      </div>
      <h2 className="text-2xl font-black font-headline text-gray-900 mb-2">Syncing with PesaPal</h2>
      <p className="text-sm font-medium text-gray-400 uppercase tracking-widest max-w-[200px]">
        Please don&apos;t close this window...
      </p>
    </div>
  )
}

export default function PesapalCallbackPage({ searchParams }: { searchParams: Promise<any> }) {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <PesapalCallbackContent searchParams={searchParams} />
    </Suspense>
  )
}
