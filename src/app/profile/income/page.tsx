
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Gem, Coins, ArrowRightLeft, Loader2, Info, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase, useFirebase } from "@/firebase"
import { doc, updateDoc, increment as firestoreIncrement, setDoc, collection } from "firebase/firestore"
import { ref, onValue, runTransaction as runRtdbTransaction } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function IncomePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore, database } = useFirebase()
  const { toast } = useToast()
  
  const [isExchanging, setIsExchanging] = useState(false)
  const [diamondBalance, setDiamondBalance] = useState(0)

  useEffect(() => {
    if (!database || !currentUser) return
    const diamondRef = ref(database, `users/${currentUser.uid}/diamondBalance`)
    return onValue(diamondRef, (snap) => setDiamondBalance(snap.val() || 0))
  }, [database, currentUser])

  const canExchange = diamondBalance >= 500

  const handleExchange = async () => {
    if (!currentUser || !firestore || !database || isExchanging || !canExchange) return
    setIsExchanging(true)

    const blocks = Math.floor(diamondBalance / 500)
    const diamondsToDeduct = blocks * 500
    const coinsToGain = blocks * 150

    try {
      // 1. RTDB Atomic Transaction (Primary)
      const userRef = ref(database, `users/${currentUser.uid}`)
      await runRtdbTransaction(userRef, (current) => {
        if (!current) return current;
        if ((current.diamondBalance || 0) < diamondsToDeduct) return undefined;
        return {
          ...current,
          diamondBalance: current.diamondBalance - diamondsToDeduct,
          coinBalance: (current.coinBalance || 0) + coinsToGain
        }
      });

      // 2. Firestore Backup Sync & Log
      const profileRef = doc(firestore, "userProfiles", currentUser.uid);
      updateDoc(profileRef, {
        diamondBalance: firestoreIncrement(-diamondsToDeduct),
        coinBalance: firestoreIncrement(coinsToGain),
        updatedAt: new Date().toISOString()
      });

      const txRef = doc(collection(profileRef, "transactions"));
      setDoc(txRef, {
        id: txRef.id,
        type: "diamond_exchange",
        amount: coinsToGain,
        diamondsUsed: diamondsToDeduct,
        transactionDate: new Date().toISOString(),
        description: `Exchanged ${diamondsToDeduct} diamonds for ${coinsToGain} coins`
      });

      toast({ title: "Exchange Successful!", description: `Received ${coinsToGain} coins.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Exchange Failed", description: error.message || "Error occurred." });
    } finally {
      setIsExchanging(false)
    }
  }

  const darkMaroon = "bg-[#5A1010]";

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900 overflow-hidden">
      <header className="px-4 py-8 flex items-center sticky top-0 bg-transparent z-10 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full shadow-sm"><ChevronLeft className="w-6 h-6" /></Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase">Income Center</h1>
      </header>

      <main className="flex-1 px-6 pb-20 space-y-8 overflow-y-auto scroll-smooth">
        <section className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Gem className="w-32 h-32" /></div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center"><Gem className="w-5 h-5 text-blue-400" /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Total Diamonds</span>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-black font-headline tracking-tighter">{diamondBalance.toLocaleString()}</span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Earned from gifts and rewards</p>
            </div>
          </div>
        </section>

        <section className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Conversion Rate</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-white/50"><Info className="w-3 h-3 text-gray-400" /><span className="text-[9px] font-bold text-gray-500">Fixed Rate</span></div>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/5 shadow-inner"><Gem className="w-8 h-8 text-blue-500" /></div>
              <span className="text-lg font-black font-headline text-gray-900">500</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Diamonds</span>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-primary/30" />
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/5 shadow-inner"><Coins className="w-8 h-8 text-primary" /></div>
              <span className="text-lg font-black font-headline text-gray-900">150</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Coins</span>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleExchange} disabled={isExchanging || !canExchange} className={cn("w-full h-18 rounded-full text-white font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3", canExchange ? darkMaroon : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
              {isExchanging ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span className="text-sm font-black uppercase tracking-widest">Exchange Now</span><ArrowUpRight className="w-5 h-5" /></>}
            </Button>
            {!canExchange && <p className="text-[9px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">Minimum 500 diamonds required to exchange</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
