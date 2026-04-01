
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth, useFirestore, useUser, deleteDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { deleteUser } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"

export default function DeleteAccountPage() {
  const router = useRouter()
  const auth = useAuth()
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user || confirmationText !== "DELETE") return

    setIsDeleting(true)
    try {
      // 1. Delete Firestore Profile Data
      const userRef = doc(firestore, "userProfiles", user.uid)
      deleteDocumentNonBlocking(userRef)

      // 2. Clear local storage if it was a persistent guest
      localStorage.removeItem('mf_guest_recovery')

      // 3. Delete from Firebase Auth
      await deleteUser(user)

      toast({
        title: "Account Deleted",
        description: "Your data has been permanently removed.",
      })
      
      router.push("/welcome")
    } catch (error: any) {
      setIsDeleting(false)
      if (error.code === 'auth/requires-recent-login') {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please sign out and sign back in to delete your account for security reasons.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: error.message || "Could not delete account. Please contact support.",
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900">
      <header className="px-4 py-4 flex items-center sticky top-0 bg-transparent z-10 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase text-red-500">Delete Account</h1>
      </header>

      <main className="flex-1 p-8 space-y-10 flex flex-col items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-100">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-headline text-gray-900 leading-tight">Permanent Action</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[280px] mx-auto">
              This will permanently delete your profile, coins, and messages. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 block text-center">
              Type <span className="underline">DELETE</span> to confirm
            </Label>
            <Input 
              placeholder="Type DELETE here" 
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="h-16 text-center rounded-2xl bg-gray-50 border-red-100 text-gray-900 placeholder:text-gray-300 text-lg font-black tracking-widest focus-visible:ring-red-500/20" 
            />
          </div>
        </div>

        <div className="w-full pt-8">
          <Button 
            className="w-full h-16 rounded-full bg-red-500 hover:bg-red-600 text-white text-lg font-black shadow-2xl shadow-red-500/20 active:scale-95 transition-all"
            onClick={handleDelete}
            disabled={isDeleting || confirmationText !== "DELETE"}
          >
            {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Deletion"}
          </Button>
          
          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
             <AlertTriangle className="w-3.5 h-3.5" />
             Account will be removed from database
          </div>
        </div>
      </main>
    </div>
  )
}
