
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Gem, Coins, ArrowRightLeft, Loader2, Info, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, runTransaction, collection } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function IncomePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  
  const [isExchanging, setIsExchanging] = useState(false)

  const userRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, "userProfiles", currentUser.uid);
  }, [firestore, currentUser])

  const { data: profile, isLoading } = useDoc(userRef)

  const diamondBalance = profile?.diamondBalance || 0
  const canExchange = diamondBalance >= 500

  const handleExchange = async () => {
    if (!currentUser || !firestore || isExchanging || !canExchange) return
    setIsExchanging(true)

    // Calculate how many 500-blocks we can exchange
    const blocks = Math.floor(diamondBalance / 500)
    const diamondsToDeduct = blocks * 500
    const coinsToGain = blocks * 150

    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef!)
        if (!userDoc.exists()) throw new Error("Profile not found")

        const currentDiamonds = userDoc.data().diamondBalance || 0
        const currentCoins = userDoc.data().coinBalance || 0

        if (currentDiamonds < diamondsToDeduct) throw new Error("INSUFFICIENT_DIAMONDS")

        transaction.update(userRef!, {
          diamondBalance: currentDiamonds - diamondsToDeduct,
          coinBalance: currentCoins + coinsToGain,
          updatedAt: new Date().toISOString()
        })

        const txRef = doc(collection(userRef!, "transactions"))
        transaction.set(txRef, {
          id: txRef.id,
          type: "diamond_exchange",
          amount: coinsToGain,
          diamondsUsed: diamondsToDeduct,
          transactionDate: new Date().toISOString(),
          description: `Exchanged ${diamondsToDeduct} diamonds for ${coinsToGain} coins`
        })
      })

      toast({
        title: "Exchange Successful!",
        description: `You've received ${coinsToGain} coins in exchange for ${diamondsToDeduct} diamonds.`,
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Exchange Failed",
        description: error.message || "An error occurred during the exchange.",
      })
    } finally {
      setIsExchanging(false)
    }
  }

  const darkMaroon = "bg-[#5A1010]";

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900 overflow-hidden">
      <header className="px-4 py-8 flex items-center sticky top-0 bg-transparent z-10 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase">Income Center</h1>
      </header>

      <main className="flex-1 px-6 pb-20 space-y-8 overflow-y-auto scroll-smooth">
        {/* Diamond Balance Hero */}
        <section className="bg-zinc-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Gem className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Gem className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Total Diamonds</span>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-black font-headline tracking-tighter">
                {isLoading ? "..." : diamondBalance.toLocaleString()}
              </span>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Earned from gifts and rewards</p>
            </div>
          </div>
        </section>

        {/* Exchange Card */}
        <section className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Conversion Rate</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-white/50">
               <Info className="w-3 h-3 text-gray-400" />
               <span className="text-[9px] font-bold text-gray-500">Fixed Rate</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center border border-blue-500/5 shadow-inner">
                <Gem className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-lg font-black font-headline text-gray-900">500</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Diamonds</span>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-primary/30" />
            </div>

            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/5 shadow-inner">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <span className="text-lg font-black font-headline text-gray-900">150</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Coins</span>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleExchange}
              disabled={isLoading || isExchanging || !canExchange}
              className={cn(
                "w-full h-18 rounded-full text-white font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3",
                canExchange ? darkMaroon : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isExchanging ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Exchange Now
                  <ArrowUpRight className="w-5 h-5" />
                </>
              )}
            </Button>
            {!canExchange && !isLoading && (
              <p className="text-[9px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">
                Minimum 500 diamonds required to exchange
              </p>
            )}
          </div>
        </section>

        {/* History Preview */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Summary</h3>
          </div>
          <div className="bg-white/20 rounded-[2rem] p-6 border border-white/20 space-y-4">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tighter">
              <span className="text-gray-500">Available to Exchange</span>
              <span className="text-gray-900">{(Math.floor(diamondBalance / 500) * 500).toLocaleString()} D</span>
            </div>
            <div className="h-px bg-white/20" />
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tighter">
              <span className="text-gray-500">Estimated Gain</span>
              <span className="text-green-600">+{ (Math.floor(diamondBalance / 500) * 150).toLocaleString() } Coins</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
