
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Building2, 
  Plus, 
  Loader2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Copy,
  LayoutGrid,
  History
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function AgentCenterPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  const [agencyName, setAgencyName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Fetch pending members
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.agencyId) return null
    return query(
      collection(firestore, "userProfiles"), 
      where("memberOfAgencyId", "==", profile.agencyId),
      where("agencyJoinStatus", "==", "pending")
    )
  }, [firestore, profile?.agencyId])

  const { data: pendingUsers, isLoading: isRequestsLoading } = useCollection(requestsQuery)

  const handleCreateAgency = async () => {
    if (!agencyName.trim() || !currentUser) return
    setIsCreating(true)
    try {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase()
      const agencyRef = doc(firestore, "agencies", generatedId)
      
      await setDoc(agencyRef, {
        id: generatedId,
        name: agencyName,
        agentId: currentUser.uid,
        createdAt: new Date().toISOString()
      })

      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        agencyId: generatedId,
        updatedAt: new Date().toISOString()
      })

      toast({ title: "Agency Created", description: `Your Agency ID is: ${generatedId}` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create agency." })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAction = async (userId: string, action: 'approved' | 'none') => {
    if (processingId) return
    setProcessingId(userId)
    try {
      await updateDoc(doc(firestore, "userProfiles", userId), {
        agencyJoinStatus: action,
        memberOfAgencyId: action === 'approved' ? profile?.agencyId : null,
        updatedAt: new Date().toISOString()
      })
      toast({ 
        title: action === 'approved' ? "User Approved" : "User Rejected", 
        description: action === 'approved' ? "They are now part of your agency." : "Application dismissed."
      })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Action failed." })
    } finally {
      setProcessingId(null)
    }
  }

  const copyId = () => {
    if (profile?.agencyId) {
      navigator.clipboard.writeText(profile.agencyId)
      toast({ title: "Copied!", description: "Agency ID copied to clipboard." })
    }
  }

  if (isProfileLoading) return <div className="flex h-svh items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  if (!profile?.isAgent) {
    return <div className="flex h-svh items-center justify-center bg-white text-zinc-400 font-black uppercase text-xs tracking-widest">Access Denied</div>
  }

  return (
    <div className="flex flex-col h-svh bg-white text-gray-900 font-body overflow-y-auto">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-900 h-10 w-10 bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
        <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">Agent Center</h1>
      </header>

      <main className="flex-1 p-6 space-y-8 pb-32">
        {!profile?.agencyId ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-black font-headline text-gray-900">Create your Agency</h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                As an official agent, you can create a team and manage members. Enter your agency name to begin.
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Agency Name</Label>
              <Input 
                placeholder="e.g., Global Star Anchor" 
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
              />
            </div>

            <Button 
              onClick={handleCreateAgency}
              disabled={isCreating || !agencyName.trim()}
              className="w-full h-16 rounded-full bg-purple-600 text-white font-black text-lg shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
            >
              {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create & Generate ID"}
            </Button>
          </section>
        ) : (
          <>
            <section className="bg-zinc-950 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Building2 className="w-32 h-32" /></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/10">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Your Agency</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black font-headline uppercase truncate">{profile.username}'s Team</h2>
                  <button onClick={copyId} className="flex items-center gap-2 mt-2 px-4 py-2 bg-white/10 rounded-full border border-white/5 active:scale-95 transition-all">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-200">ID: {profile.agencyId}</span>
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-purple-500/40" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Join Requests</h3>
                </div>
                <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full uppercase">
                  {pendingUsers?.length || 0} New
                </span>
              </div>

              {isRequestsLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-purple-200" /></div>
              ) : pendingUsers && pendingUsers.length > 0 ? (
                <div className="space-y-3">
                  {pendingUsers.map((user: any) => (
                    <div 
                      key={user.id}
                      className="bg-gray-50/50 border border-gray-100 p-4 rounded-[2rem] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                          <AvatarImage src={user.profilePhotoUrls?.[0]} className="object-cover" />
                          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 leading-none">{user.username}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {user.numericId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleAction(user.id, 'none')}
                          disabled={!!processingId}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                        <Button 
                          size="icon" 
                          onClick={() => handleAction(user.id, 'approved')}
                          disabled={!!processingId}
                          className="w-10 h-10 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20 active:scale-90"
                        >
                          {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-20">
                  <Users className="w-12 h-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No pending requests</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
