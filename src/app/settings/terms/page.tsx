"use client"

import { useRouter } from "navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-svh bg-transparent text-gray-900">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-transparent z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase">Terms of Service</h1>
      </header>

      <main className="flex-1 px-8 pt-4 pb-20 space-y-10 overflow-y-auto">
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">1. Acceptance and Eligibility</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            By creating an account on Matchflow, you agree to these terms. You must be at least 18 years of age. Any use of the platform by minors is strictly prohibited. You represent that all information provided during signup is accurate and that you will maintain the security of your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">2. Coin and Diamond Economy</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            Matchflow operates on a virtual currency system. Coins are purchased for use within the app and are non-refundable. Diamonds earned through gifts can be converted to coins or requested as cash payouts if you are an approved Agency member. Matchflow reserves the right to adjust conversion rates and transaction fees at any time to maintain the platform's stability.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">3. Community Standards</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            We maintain a zero-tolerance policy for harassment, explicit sexual content, hate speech, or scamming. Users found violating these standards will be banned permanently. Matchflow is a place for genuine connection; creating fake profiles or using bots is a breach of these terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">4. Subscriptions and Agencies</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            Official Hosts and Agency Heads are subject to additional vetting. Agency members agree to allow their respective Agency Head to process their financial payouts. Matchflow is not responsible for disputes between Agency members and their Heads, though we will investigate reported misconduct.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">5. Limitation of Liability</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            Matchflow is provided "as is." While we strive for 100% uptime and high call quality, we are not liable for technical interruptions, data loss, or the conduct of other users. We reserve the right to modify or terminate services at our discretion.
          </p>
        </section>

        <p className="text-[10px] font-black text-gray-300 uppercase pt-10">Last updated: February 2025</p>
      </main>
    </div>
  )
}
