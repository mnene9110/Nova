
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RotateCcw, Globe, Loader2, CheckCircle, VenetianMask, ClipboardList } from "lucide-react"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
      gender: u.gender || "male",
      age: age || 18,
      image: (u.profilePhotoUrls && u.profilePhotoUrls[0]) || `https://picsum.photos/seed/${u.id}/400/600`
    }
  })

  return (
    <div className="flex flex-col h-svh bg-transparent overflow-y-auto pb-32 relative scroll-smooth">
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/mystery-note')}
            className="group relative flex flex-col items-center justify-center h-28 bg-[#FD8A6B] rounded-[2.25rem] shadow-xl shadow-[#FD8A6B]/20 active:scale-95 transition-all overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10">
                <VenetianMask className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">Mystery Note</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/task-center')}
            className="group relative flex flex-col items-center justify-center h-28 bg-[#EB4C4C] rounded-[2.25rem] shadow-xl shadow-[#EB4C4C]/20 active:scale-95 transition-all overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/10">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">Task Center</span>
            </div>
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-30 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="h-14 px-8 bg-white/40 backdrop-blur-2xl border border-white/40 rounded-full flex items-center shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <h2 className="text-[#7C2D12] font-black uppercase tracking-[0.25em] text-[11px]">Recommended For You</h2>
          </div>
          
          <button 
            onClick={handleRefresh} 
            disabled={isInitialLoading}
            className="w-14 h-14 rounded-full bg-white/40 backdrop-blur-2xl border border-white/40 flex items-center justify-center active:rotate-180 transition-all duration-700 shadow-[0_12px_40px_rgba(0,0,0,0.08)] text-primary disabled:opacity-50"
          >
            {isInitialLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <main className="px-5 grid grid-cols-2 gap-4 pb-8 flex-1 mt-2">
        {mappedUsers.map((user) => (
          <div 
            key={user.id} 
            className="group relative aspect-[3/4.2] rounded-[2.5rem] overflow-hidden bg-white/10 shadow-md transition-all hover:shadow-xl active:scale-[0.98]" 
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            <div className="absolute inset-0 z-0">
              <Image 
                src={user.image} 
                alt={user.name} 
                fill 
                className="object-cover transition-transform group-hover:scale-110 duration-[1500ms]" 
                data-ai-hint="dating profile photo" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {user.isOnline && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/30 backdrop-blur-md rounded-full border border-white/10 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                <span className="text-[7px] font-black text-white uppercase tracking-wider">Online</span>
              </div>
            )}

            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(`/chat/${user.id}`); 
              }}
              className="absolute top-4 right-4 px-4 h-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-full flex items-center justify-center z-10 active:scale-90 transition-all"
            >
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Chat</span>
            </button>

            <div className="absolute inset-x-0 bottom-0 p-5 z-10 pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-black text-sm tracking-tight truncate max-w-[100px] drop-shadow-md">
                    {user.name}
                  </h3>
                  {user.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-[#FD8A6B] fill-[#FD8A6B]/10" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <div className="px-2 h-5 rounded-md bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white tracking-tight leading-none">{user.age}</span>
                  </div>
                  
                  <div className="px-2 h-5 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/10 flex items-center justify-center">
                    <span className="text-[7px] font-black text-white uppercase tracking-wider leading-none">{user.gender}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isInitialLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4.2] rounded-[2.5rem] bg-white/10 animate-pulse border border-white/5" />
        ))}
      </main>
    </div>
  )
}
