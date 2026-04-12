"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RotateCcw, Loader2, CheckCircle, MessageSquare } from "lucide-react"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

let cachedUsers: any[] = []
let cachedInitialLoaded: boolean = false

export function clearDiscoverCache() {
  cachedUsers = []
  cachedInitialLoaded = false
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function DiscoverPage() {
  const { firestore } = useFirebase()
  const { user: currentUser } = useUser()
  const router = useRouter()

  const [users, setUsers] = useState<any[]>(cachedUsers)
  const [isInitialLoading, setIsInitialLoading] = useState(!cachedInitialLoaded)
  
  const userProfileRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: currentUserProfile } = useDoc(userProfileRef)

  const fetchUsers = async (isRefresh = false) => {
    if (!firestore || !currentUser || !currentUserProfile) return;
    
    if (isRefresh) {
      setIsInitialLoading(true);
    } else if (cachedInitialLoaded && !isRefresh) {
      setIsInitialLoading(false);
      return;
    }

    try {
      const currentGender = (currentUserProfile?.gender || 'male').toLowerCase()
      const targetGender = currentGender === 'male' ? 'female' : 'male'

      const usersQuery = query(
        collection(firestore, "userProfiles"),
        where("gender", "==", targetGender),
        limit(50)
      );
      
      const snap = await getDocs(usersQuery);
      
      if (snap.empty) {
        setUsers([]);
        cachedUsers = [];
        return;
      }

      const allUsers = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.isSupport !== true && u.id !== currentUser.uid);
      
      const onlineUsers = allUsers.filter((u: any) => u.isOnline === true);
      const offlineUsers = allUsers.filter((u: any) => u.isOnline !== true);

      const sorted = [...shuffleArray(onlineUsers), ...shuffleArray(offlineUsers)];
      
      setUsers(sorted);
      cachedUsers = sorted;
      cachedInitialLoaded = true;
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    if (currentUserProfile) fetchUsers();
  }, [currentUserProfile]);

  const handleRefresh = async () => {
    clearDiscoverCache();
    await fetchUsers(true);
  }

  const mappedUsers = users.map(u => {
    let age = null;
    if (u.dateOfBirth) {
      const birthDate = new Date(u.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    }

    return {
      id: u.id,
      name: u.username || "Match",
      location: u.location || "Kenya",
      isVerified: !!u.isVerified,
      isOnline: !!u.isOnline,
      gender: u.gender?.toLowerCase() || "male",
      age: age || 18,
      image: (u.profilePhotoUrls && u.profilePhotoUrls[0]) || `https://picsum.photos/seed/${u.id}/400/600`
    }
  })

  return (
    <div className="flex flex-col min-h-svh bg-white overflow-y-auto pb-32 relative scroll-smooth">
      {/* Top Background Container - Solid Brand Red */}
      <div className="px-4 pt-10 pb-6 shrink-0 bg-[#EB4C4C]">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/mystery-note')}
            className="group relative flex flex-col items-center justify-center aspect-[1.3/1] rounded-[2rem] transition-all overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 active:translate-y-1 shadow-lg outline-none ring-0 select-none"
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 relative flex items-center justify-center drop-shadow-lg">
                <Image src="/mystery.png" alt="Mystery" width={56} height={56} className="object-contain" />
              </div>
              <span className="text-[12px] font-black text-white tracking-tight uppercase">Mystery Note</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/task-center')}
            className="group relative flex flex-col items-center justify-center aspect-[1.3/1] rounded-[2rem] transition-all overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 active:translate-y-1 shadow-lg outline-none ring-0 select-none"
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-14 h-14 relative flex items-center justify-center drop-shadow-lg">
                <Image src="/task.png" alt="Task" width={56} height={56} className="object-contain" />
              </div>
              <span className="text-[12px] font-black text-white tracking-tight uppercase">Task Center</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recommended Header - Sticky Colored */}
      <div className="sticky top-0 z-30 px-4 py-4 shrink-0 bg-[#EB4C4C] shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-black text-white tracking-tight ml-1 uppercase tracking-[0.1em]">Recommended for you</h2>
          
          <button 
            onClick={handleRefresh} 
            disabled={isInitialLoading}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center active:rotate-180 transition-all duration-700 text-white shadow-sm disabled:opacity-50 outline-none ring-0 select-none"
          >
            {isInitialLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Feed Grid */}
      <main className="px-4 grid grid-cols-2 gap-2 pb-8 flex-1 mt-2">
        {mappedUsers.map((user) => (
          <div 
            key={user.id} 
            className="group relative aspect-[3/3.8] rounded-[1.75rem] overflow-hidden bg-white border border-gray-100 cursor-pointer shadow-sm outline-none ring-0 select-none" 
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            <div className="absolute inset-0 z-0">
              <Image 
                src={user.image} 
                alt={user.name} 
                fill 
                className="object-cover" 
                data-ai-hint="dating profile photo" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            {/* Red Chat Icon - Top Right */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(`/chat/${user.id}`); 
              }}
              className="absolute top-3 right-3 w-10 h-10 bg-[#EB4C4C] rounded-full flex items-center justify-center z-10 transition-all active:scale-90 shadow-lg border border-white/20 outline-none ring-0 select-none"
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </button>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-black text-[15px] tracking-tight truncate drop-shadow-md">
                    {user.name}
                  </h3>
                  {user.isVerified && (
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-3 h-3 text-[#EB4C4C] fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="px-2 h-5 rounded-md flex items-center justify-center shadow-sm bg-zinc-900/40 backdrop-blur-md">
                    <span className="text-[9px] font-black text-white leading-none">{user.age}</span>
                  </div>
                  <div className="px-2 h-5 rounded-md bg-[#EB4C4C] flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-white uppercase tracking-tighter leading-none">{user.location.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isInitialLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/3.8] rounded-[1.75rem] bg-gray-100 animate-pulse border border-gray-50" />
        ))}
      </main>
    </div>
  )
}
