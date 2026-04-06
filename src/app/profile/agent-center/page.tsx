
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Building2, 
  Loader2, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Copy,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Gem,
  Coins,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useDoc, useMemoFirebase, useFirebase } from "@/firebase"
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  runTransaction, 
  increment, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  where
} from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PAGE_SIZE = 20
const MAX_AGENCY_MEMBERS = 100

let cachedMembers: any[] = []
let lastVisibleMember: any = null
let hasMoreMembersToLoad = true

export default function AgentCenterPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser?.uid])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef)

  const [agencyName, setAgencyName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>(cachedMembers)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialMembersLoading, setIsInitialMembersLoading] = useState(cachedMembers.length === 0)

  useEffect(() => {
    if (!firestore || !profile?.agencyId) return

    const unsubRequests = onSnapshot(collection(firestore, "agencies", profile.agencyId, "requests"), (snap) => {
      setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const unsubWith = onSnapshot(
      query(collection(firestore, "agencies", profile.agencyId, "withdrawals"), where("status", "==", "pending")), 
      (snap) => {
        setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    )

    if (cachedMembers.length === 0) {
      loadMembers()
    }

    return () => { unsubRequests(); unsubWith(); }
  }, [firestore, profile?.agencyId])

  const pendingWithdrawalTotal = useMemo(() => {
    return withdrawals.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [withdrawals]);

  const loadMembers = async (isLoadMore = false) => {
    if (!firestore || !profile?.agencyId || (!hasMoreMembersToLoad && isLoadMore)) return
    
    if (isLoadMore) setIsLoadingMore(true)
    else setIsInitialMembersLoading(true)

    try {
      let q = query(
        collection(firestore, "agencies", profile.agencyId, "members"),
        orderBy("joinedAt", "desc"),
        limit(PAGE_SIZE)
      )

      if (isLoadMore && lastVisibleMember) {
        q = query(q, startAfter(lastVisibleMember))
      }

      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      
      if (isLoadMore) {
        const combined = [...members, ...list]
        setMembers(combined)
        cachedMembers = combined
      } else {
        setMembers(list)
        cachedMembers = list
      }

      lastVisibleMember = snap.docs[snap.docs.length - 1]
      hasMoreMembersToLoad = snap.docs.length === PAGE_SIZE
    } catch (e) {
      console.error("Failed to load members", e)
    } finally {
      setIsLoadingMore(false)
      setIsInitialMembersLoading(false)
    }
  }

  const handleCreateAgency = async () => {
    if (!agencyName.trim() || !currentUser || !firestore || !profile) return
    setIsCreating(true)
    try {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      await runTransaction(firestore, async (transaction) => {
        const agencyRef = doc(firestore, "agencies", generatedId)
        transaction.set(agencyRef, {
          id: generatedId,
          name: agencyName,
          agentId: currentUser.uid,
          memberCount: 1,
          createdAt: serverTimestamp()
        })

        const memberRef = doc(firestore, "agencies", generatedId, "members", currentUser.uid)
        transaction.set(memberRef, {
          userId: currentUser.uid,
          username: profile.username || "Owner",
          photo: profile.profilePhotoUrls?.[0] || "",
          numericId: profile.numericId || "",
          role: "owner",
          joinedAt: Date.now()
        })

        transaction.update(doc(firestore, "userProfiles", currentUser.uid), {
          agencyId: generatedId,
          agencyJoinStatus: "approved",
          memberOfAgencyId: generatedId,
          updatedAt: new Date().toISOString()
        })
      })

      toast({ title: "Agency Created", description: `Your Agency ID is: ${generatedId}` })
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create agency." })
    } finally {
      setIsCreating(false)
    }
  }

  const handleRequestAction = async (userId: string, action: 'approved' | 'rejected', userData: any) => {
    if (!firestore || !profile?.agencyId || processingId) return
    
    if (action === 'approved' && members.length >= MAX_AGENCY_MEMBERS) {
      toast({ variant: "destructive", title: "Capacity Full", description: "Your agency has reached the maximum of 100 members." });
      return;
    }

    setProcessingId(userId)
    try {
      await runTransaction(firestore, async (transaction) => {
        const agencyId = profile.agencyId
        const userProfileRef = doc(firestore, "userProfiles", userId)
        const requestRef = doc(firestore, "agencies", agencyId, "requests", userId)
        const agencyDocRef = doc(firestore, "agencies", agencyId)
        
        if (action === 'approved') {
          const memberRef = doc(firestore, "agencies", agencyId, "members", userId)
          transaction.set(memberRef, { ...userData, joinedAt: Date.now() })
          transaction.update(userProfileRef, { agencyJoinStatus: 'approved', memberOfAgencyId: agencyId })
          transaction.update(agencyDocRef, { memberCount: increment(1) })
        } else {
          transaction.update(userProfileRef, { agencyJoinStatus: 'none', memberOfAgencyId: null })
        }
        transaction.delete(requestRef)
      })

      if (action === 'approved') {
        const newMember = { ...userData, id: userId, joinedAt: Date.now() };
        setMembers(prev => [newMember, ...prev]);
        cachedMembers = [newMember, ...cachedMembers];
      }

      toast({ title: action === 'approved' ? "User Approved" : "User Rejected" })
    } catch (e) {
      toast({ variant: "destructive", title: "Action failed" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAsPaid = async (withdrawal: any) => {
    if (!firestore || !profile?.agencyId || !currentUser || processingId) return
    setProcessingId(withdrawal.id)
    try {
      const feedbackText = `✅ Your withdrawal request for ${withdrawal.diamondAmount} diamonds (Ksh ${withdrawal.amount}) has been paid through the agency anchor. Please check your account.`
      const chatId = [withdrawal.userId, currentUser.uid].sort().join("_")
      const chatRef = doc(firestore, "chats", chatId)
      const msgRef = doc(collection(chatRef, "messages"))
      const withdrawDocRef = doc(firestore, "agencies", profile.agencyId, "withdrawals", withdrawal.id)

      await runTransaction(firestore, async (transaction) => {
        transaction.update(withdrawDocRef, { status: 'paid', paidAt: serverTimestamp() })
        
        transaction.set(msgRef, {
          messageText: feedbackText,
          senderId: currentUser.uid,
          sentAt: serverTimestamp(),
          status: 'sent'
        })

        transaction.set(chatRef, {
          lastMessage: feedbackText,
          timestamp: serverTimestamp(),
          participants: [currentUser.uid, withdrawal.userId],
          [`unreadCount_${withdrawal.userId}`]: increment(1),
          [`userHasSent_${currentUser.uid}`]: true
        }, { merge: true })
      });

      toast({ title: "Paid", description: "Request marked as paid and user notified." })
    } catch (e) {
      toast({ variant: "destructive", title: "Error" })
    } finally {
      setProcessingId(null)
    }
  }

  const copyId = () => {
    if (profile?.agencyId) {
      navigator.clipboard.writeText(profile.agencyId)
      toast({ title: "Copied!", description: "Agency ID copied." })
    }
  }

  if (isProfileLoading) return <div className="flex h-svh items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  if (!profile?.isAgent) {
    return <div className="flex h-svh items-center justify-center bg-white text-zinc-400 font-black uppercase text-xs tracking-widest">Access Denied</div>
  }

  const isAtCapacity = members.length >= MAX_AGENCY_MEMBERS;

  return (
    <div className="flex flex-col h-svh bg-white text-gray-900 font-body overflow-y-auto">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-900 h-10 w-10 bg-gray-50 rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
        <h1 className="flex-1 text-center text-sm font-black uppercase tracking-widest mr-10">Agent Center</h1>
      </header>

      <main className="flex-1 p-6 space-y-8 pb-32">
        {!profile?.agencyId ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4"><div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center"><Building2 className="w-8 h-8 text-purple-600" /></div><h2 className="text-3xl font-black font-headline text-gray-900">Create your Agency</h2><p className="text-sm text-gray-500 font-medium leading-relaxed">As an official agent, you can manage members and payouts.</p></div>
            <div className="space-y-4"><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Agency Name</Label><Input placeholder="e.g., Global Star Anchor" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
            <Button onClick={handleCreateAgency} disabled={isCreating || !agencyName.trim()} className="w-full h-16 rounded-full bg-purple-600 text-white font-black text-lg shadow-xl active:scale-95 transition-all">{isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create & Generate ID"}</Button>
          </section>
        ) : (
          <div className="space-y-8">
            <section className="bg-zinc-950 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Building2 className="w-32 h-32" /></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/10"><Building2 className="w-5 h-5 text-purple-400" /></div><span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Your Agency</span></div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span className={cn("text-[9px] font-black uppercase", isAtCapacity ? "text-amber-400" : "text-white/60")}>
                      {members.length} / {MAX_AGENCY_MEMBERS}
                    </span>
                  </div>
                </div>
                <div><h2 className="text-2xl font-black font-headline uppercase truncate">{profile.username}'s Team</h2><button onClick={copyId} className="flex items-center gap-2 mt-2 px-4 py-2 bg-white/10 rounded-full border border-white/5 active:scale-95 transition-all"><span className="text-xs font-black uppercase tracking-widest text-purple-200">ID: {profile.agencyId}</span><Copy className="w-3.5 h-3.5 text-purple-400" /></button></div>
              </div>
            </section>

            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="w-full bg-gray-100 p-1.5 h-14 rounded-full mb-6">
                <TabsTrigger value="requests" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-full">Requests</TabsTrigger>
                <TabsTrigger value="members" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-full">Members</TabsTrigger>
                <TabsTrigger value="withdrawals" className="flex-1 rounded-full text-[10px] font-black uppercase tracking-widest h-full">Payouts</TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-4">
                {isAtCapacity && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Agency is full. Remove members to approve more.</p>
                  </div>
                )}
                {pendingRequests.map(req => (
                  <div key={req.id} className="bg-gray-50 p-4 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-3"><Avatar className="w-12 h-12"><AvatarImage src={req.photo} /><AvatarFallback>{req.username?.[0]}</AvatarFallback></Avatar><div><p className="text-sm font-black">{req.username}</p><p className="text-[9px] font-bold text-gray-400 uppercase">ID: {req.numericId}</p></div></div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleRequestAction(req.id, 'rejected', req)} disabled={!!processingId} className="w-10 h-10 rounded-full bg-red-50 text-red-500"><XCircle className="w-5 h-5" /></Button>
                      <Button size="icon" onClick={() => handleRequestAction(req.id, 'approved', req)} disabled={!!processingId || isAtCapacity} className="w-10 h-10 rounded-full bg-green-500 text-white disabled:bg-gray-200">
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="py-10 text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">No pending applications</p></div>
                )}
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                {isInitialMembersLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
                ) : members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map(member => (
                      <div key={member.id} className="bg-white border border-gray-100 p-4 rounded-[2.25rem] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-md"><AvatarImage src={member.photo} /><AvatarFallback>{member.username?.[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="text-sm font-black">{member.username}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{member.role === 'owner' ? 'Head of Agency' : 'Member'}</p>
                          </div>
                        </div>
                        {member.userId !== currentUser.uid && (
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/chat/${member.id}`)} className="h-10 px-4 rounded-full bg-primary/5 text-primary font-black text-[9px] uppercase tracking-widest">Chat</Button>
                        )}
                      </div>
                    ))}
                    {hasMoreMembersToLoad && (
                      <Button 
                        variant="ghost" 
                        onClick={() => loadMembers(true)} 
                        disabled={isLoadingMore}
                        className="w-full h-14 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                      >
                        {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2 rotate-90" />}
                        Load More Members
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">No members yet</p></div>
                )}
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4">
                <div className="space-y-3">
                  {withdrawals.length > 0 ? withdrawals.map(w => (
                    <div key={w.id} className="bg-white border border-gray-100 p-5 rounded-[2.25rem] space-y-4 shadow-sm animate-in fade-in zoom-in">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10"><AvatarImage src={w.photo} /><AvatarFallback>{w.username?.[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="text-xs font-black">{w.username}</p>
                            <div className="flex items-center gap-1">
                              <Gem className="w-3 h-3 text-blue-400" />
                              <span className="text-[10px] font-bold text-gray-400">{w.diamondAmount?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-green-600">{w.amount?.toLocaleString()} KES</p>
                          <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-500")}>pending</span>
                        </div>
                      </div>
                      <Button onClick={() => handleMarkAsPaid(w)} disabled={!!processingId} className="w-full h-12 rounded-full bg-zinc-900 text-white font-black text-xs uppercase tracking-widest gap-2">{processingId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Confirm Paid</Button>
                    </div>
                  )) : (
                    <div className="py-10 text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">No pending payouts</p></div>
                  )}
                </div>

                {withdrawals.length > 0 && (
                  <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-green-600" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-green-700">Payout Summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-green-600/60 uppercase">Requests</p>
                        <p className="text-xl font-black text-green-700">{withdrawals.length}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black text-green-600/60 uppercase">Total Payout</p>
                        <div className="flex items-center justify-end gap-1.5">
                          <p className="text-xl font-black text-green-700">{pendingWithdrawalTotal.toLocaleString()} KES</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}
