"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase">Privacy Policy</h1>
      </header>

      <main className="flex-1 px-8 pt-4 pb-20 space-y-10 overflow-y-auto">
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">1. Information We Collect</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            We collect profile information such as your name, date of birth, gender, and profile photos. To provide local matching, we also process your approximate location based on your network. We use AI models to analyze live selfies for identity verification, ensuring a safe community. Biometric data from these selfies is processed in real-time and is not permanently stored.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">2. Real-time Communication Security</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            All audio and video calls on Nova are end-to-end encrypted using Agora and TRTC technology. We do not record, store, or monitor your private calls. Chat messages are stored securely in Firestore to allow synchronization across devices, and you have the right to delete them at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">3. Financial Information</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            Payment processing is handled by third-party providers like Paystack. Nova does not store your credit card or mobile money PINs. We only retain transaction records (amount, date, package) to maintain your coin balance and provide customer support.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">4. Data Sharing and Third Parties</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            We do not sell your personal data. We share information with service providers (Firebase, Agora, Paystack) only to the extent necessary to run the app. We may disclose information if required by law or to enforce our community guidelines in cases of harassment or illegal activity.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">5. User Rights and Deletion</h2>
          <p className="text-sm font-medium text-gray-600 leading-relaxed bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/40">
            You have full control over your data. You can edit your profile or delete your account permanently through the settings menu. Deletion removes your profile, photos, and messages from our active database immediately.
          </p>
        </section>

        <p className="text-[10px] font-black text-gray-300 uppercase pt-10">Last updated: February 2025</p>
      </main>
    </div>
  )
}
