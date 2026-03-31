
"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const auth = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/welcome")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "An error occurred while signing out. Please try again.",
      })
    }
  }

  const settingsItems = [
    { label: "Bind account" },
    { label: "Charge settings" },
    { label: "Rights Center" },
    { label: "Chat settings" },
    { label: "Blocked List" },
    { label: "Language" },
    { label: "Clear Cache" },
    { label: "About MatchFlow" },
    { label: "Sign Out", onClick: handleSignOut },
  ]

  return (
    <div className="flex flex-col h-svh bg-white">
      {/* Header */}
      <header className="px-4 py-6 flex items-center justify-between sticky top-0 bg-white z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-xl font-bold font-headline flex-1 text-center mr-10">Settings</h1>
      </header>

      {/* Settings List */}
      <main className="flex-1 px-4 pt-4">
        <div className="space-y-1">
          {settingsItems.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={item.onClick || (() => {})}
                className="w-full flex items-center justify-between py-5 px-2 hover:bg-gray-50 transition-colors group"
              >
                <span className="text-base font-medium text-gray-700">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
              </button>
              {idx < settingsItems.length - 1 && <Separator className="bg-gray-100" />}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-12 pt-8 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-primary rounded-[1.5rem] shadow-xl flex items-center justify-center transform rotate-3">
            <span className="text-white text-3xl font-bold font-headline -rotate-3">MF</span>
          </div>
          <div className="absolute -inset-2 bg-primary/5 rounded-full blur-2xl -z-10" />
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-gray-400">3.1.0</p>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
            <span>Privacy Policy</span>
            <span className="w-px h-3 bg-gray-200" />
            <span>Terms of Service</span>
            <span className="w-px h-3 bg-gray-200" />
            <span>Contact us</span>
            <span className="w-px h-3 bg-gray-200" />
            <span>Delete Account</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
