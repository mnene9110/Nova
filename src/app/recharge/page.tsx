
"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, Check, History, Loader2, Zap, Users, MessageCircle, Copy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFirebase, useDoc, useUser, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { initializePaystackTransaction } from "@/app/actions/paystack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"

// Standard Pricing
export const STANDARD_PACKAGES = [
  { amount: 500, priceKes: 70 },
  { amount: 1000, priceKes: 120 },
  { amount: 2000, priceKes: 240 },
  { amount: 5000, priceKes: 600 },
  { amount: 10000, priceKes: 1200 },
  { amount: 12500, priceKes: 1500 },
]

export const COUNTRY_CURRENCIES: Record<string, { code: string; symbol: string; rate: number }> = {
  "Kenya": { code: "KES", symbol: "Ksh", rate: 1.0 },
};

function RechargeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()
  
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSellersOpen, setIsSellersOpen] = useState(false)

  const meRef = useMemoFirebase(() => user ? doc(firestore, "userProfiles", user.uid) : null, [firestore, user])
  const { data: profile } = useDoc(meRef)

  const currencyInfo = COUNTRY_CURRENCIES["Kenya"];

  // Get Coinsellers
  const coinsellersQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "userProfiles"), where("isCoinseller", "==", true))
  }, [firestore])

  const { data: coinsellers, isLoading: isSellersLoading } = useCollection(coinsellersQuery)

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted || isProcessing) {
        setIsProcessing(false)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => setIsProcessing(false), 1500)
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isProcessing])

  useEffect(() => {
    const status = searchParams?.get('status')
    if (status === 'success') {
      toast({ title: "Payment Successful", description: "Your balance has been updated." });
    } else if (status === 'error') {
      toast({ variant: "destructive", title: "Payment Failed" });
    }
  }, [searchParams, toast])

  const handlePaystack = async () => {
    if (!user || !selectedPackage || isProcessing) return
    setIsProcessing(true)

    const localPrice = Math.round(selectedPackage.priceKes * currencyInfo.rate)
    const email = user.email || `guest_${user.uid.slice(0, 8)}@nova.app`
    
    try {
      const result = await initializePaystackTransaction(email, localPrice, {
        userId: user.uid,
        packageAmount: selectedPackage.amount
      })

      if (result.error) {
        setIsProcessing(false)
        toast({ variant: "destructive", title: "Error", description: result.error })
        return
      }

      if (result.authorization_url) {
        window.location.href = result.authorization_url
      }
    } catch (e) {
      setIsProcessing(false)
      toast({ variant: "destructive", title: "Error", description: "Could not initialize payment." })
    }
  }

  const handleChatWithSeller = (sellerId: string) => {
    const localPrice = selectedPackage ? Math.round(selectedPackage.priceKes * currencyInfo.rate) : 0;
    const message = selectedPackage 
      ? `Hello! I want to buy ${selectedPackage.amount} coins for ${currencyInfo.symbol} ${localPrice.toLocaleString()}` 
      : "Hello! I want to buy coins."
    
    setIsSellersOpen(false)
    router.push(`/chat/${sellerId}?msg=${encodeURIComponent(message)}`)
  }

  const copySellerId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: "ID Copied", description: "Coinseller ID copied." })
  }

  const payButtonText = selectedPackage 
    ? `Pay Ksh ${Math.round(selectedPackage.priceKes).toLocaleString()}` 
    : "Pay Ksh ---"

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900 overflow-hidden">
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-transparent z-10 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full shadow-sm"><ChevronLeft className="w-6 h-6" /></Button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black font-headline tracking-widest uppercase text-white drop-shadow-md">Wallet</h1>
          <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Kenya Region</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.push('/recharge/history')} className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full"><History className="w-5 h-5" /></Button>
      </header>

      <main className="flex-1 px-6 pt-4 pb-44 overflow-y-auto scroll-smooth">
        <section className="mb-8">
          <div className="flex items-center gap-4 bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-xl">
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center"><span className="text-primary font-black text-2xl italic">S</span></div>
            <div className="flex flex-col">
              <span className="text-4xl font-black font-headline tracking-tighter text-gray-900">{(profile?.coinBalance || 0).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Available Coins</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-3 ml-2 drop-shadow-sm">Select Package</h2>
          <div className="grid grid-cols-3 gap-3">
            {STANDARD_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage?.amount === pkg.amount;
              const localPrice = Math.round(pkg.priceKes * currencyInfo.rate);
              
              return (
                <Card key={pkg.amount} onClick={() => setSelectedPackage(pkg)} className={cn("relative aspect-square flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer rounded-[1.75rem]", isSelected ? "border-primary bg-white shadow-2xl scale-[1.05]" : "border-white/40 bg-white/20")}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isSelected ? "bg-primary" : "bg-primary/10")}><span className={cn("font-black text-sm italic", isSelected ? "text-white" : "text-primary")}>S</span></div>
                  <div className="text-center">
                    <p className={cn("text-sm font-black", isSelected ? "text-primary" : "text-gray-900")}>{pkg.amount.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-gray-400">
                      {currencyInfo.symbol} {localPrice.toLocaleString()}
                    </p>
                  </div>
                  {isSelected && (<div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg"><Check className="w-3 h-3 text-white stroke-[4]" /></div>)}
                </Card>
              )
            })}
          </div>
        </section>

        <div className="mt-10 space-y-4">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] ml-2">Digital Top-up</h3>
          <Button 
            onClick={handlePaystack} 
            disabled={isProcessing || !selectedPackage}
            className={cn(
              "w-full h-20 rounded-full text-white font-black text-xl shadow-2xl transition-all active:scale-95 gap-3",
              selectedPackage ? "bg-primary" : "bg-primary/50"
            )}
          >
            {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : (
              <>
                <span>{payButtonText}</span>
                <Zap className="w-5 h-5 text-amber-400 fill-current" />
              </>
            )}
          </Button>

          <Sheet open={isSellersOpen} onOpenChange={setIsSellersOpen}>
            <SheetTrigger asChild>
              <button className="w-full h-20 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 flex items-center px-8 gap-4 active:scale-95 transition-all shadow-lg group">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Manual Purchase</span>
                  <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">Official Coinsellers</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[3rem] p-0 border-none bg-white overflow-hidden flex flex-col max-h-[85svh]">
              <SheetHeader className="px-8 pt-10 pb-4 shrink-0">
                <SheetTitle className="text-2xl font-black font-headline text-gray-900">Verified Sellers</SheetTitle>
                <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Select a seller to purchase via Chat/M-Pesa
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pb-20">
                {isSellersLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Finding sellers...</span>
                  </div>
                ) : coinsellers && coinsellers.length > 0 ? (
                  coinsellers.map((seller: any) => (
                    <div 
                      key={seller.id}
                      className="w-full flex items-center justify-between p-5 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                          <AvatarImage src={seller.profilePhotoUrls?.[0]} className="object-cover" />
                          <AvatarFallback className="bg-primary text-white text-xs font-black">{seller.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-gray-900">{seller.username}</span>
                          <button onClick={() => copySellerId(seller.numericId?.toString())} className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1 active:opacity-50">
                            ID: {seller.numericId || "---"}
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleChatWithSeller(seller.id)}
                        className="h-12 px-6 rounded-full bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-90 transition-all gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-30">
                    <Users className="w-12 h-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Sellers Online</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 text-center">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Encrypted & Secure Payments</p>
      </footer>
    </div>
  )
}

export default function RechargePage() {
  return (
    <Suspense fallback={<div className="flex h-svh items-center justify-center bg-transparent" />}>
      <RechargeContent />
    </Suspense>
  )
}
