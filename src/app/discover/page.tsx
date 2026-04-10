"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RotateCcw, Globe, Loader2, CheckCircle, VenetianMask, ClipboardList, MessageCircle } from "lucide-react"
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
      <div className="px-5 pt-6 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/mystery-note')}
            className="group relative flex flex-col items-center justify-center h-24 bg-[#FD8A6B] rounded-[2rem] shadow-lg active:scale-95 transition-all overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                <VenetianMask className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white">Mystery Note</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/task-center')}
            className="group relative flex flex-col items-center justify-center h-24 bg-[#EB4C4C] rounded-[2rem] shadow-lg active:scale-95 transition-all overflow-hidden"
          >
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white">Task Center</span>
            </div>
          </button>
        </div>
      </div>

      <div className="sticky top-0 z-30 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="h-12 px-6 glass-card rounded-full flex items-center native-shadow">
            <h2 className="text-[#7C2D12] font-black uppercase tracking-[0.2em] text-[10px]">Recommended</h2>
          </div>
          
          <button 
            onClick={handleRefresh} 
            disabled={isInitialLoading}
            className="w-12 h-12 rounded-full glass-card flex items-center justify-center active:rotate-180 transition-all duration-700 native-shadow text-primary disabled:opacity-50"
          >
            {isInitialLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <main className="px-5 grid grid-cols-2 gap-4 pb-8 flex-1 mt-2">
        {mappedUsers.map((user) => (
          <div 
            key={user.id} 
            className="group relative aspect-[3/4.5] rounded-[2.25rem] overflow-hidden bg-white/10 native-shadow transition-all active:scale-[0.98]" 
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            <div className="absolute inset-0 z-0">
              <Image 
                src={user.image} 
                alt={user.name} 
                fill 
                className="object-cover transition-transform group-hover:scale-105 duration-[1500ms]" 
                data-ai-hint="dating profile photo" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            {user.isOnline && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/5 z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[7px] font-black text-white uppercase tracking-wider">Live</span>
              </div>
            )}

            {/* Floating Chat Button */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(`/chat/${user.id}`); 
              }}
              className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/20 native-shadow rounded-2xl flex items-center justify-center z-10 active:scale-90 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </button>

            <div className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-black text-sm tracking-tight truncate max-w-[90px]">
                    {user.name}
                  </h3>
                  {user.isVerified && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-400/10" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1 opacity-80">
                  <div className="px-2 h-4 rounded-md bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                    <span className="text-[8px] font-black text-white tracking-tight leading-none">{user.age}</span>
                  </div>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">{user.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isInitialLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4.5] rounded-[2.25rem] bg-white/10 animate-pulse border border-white/5" />
        ))}
      </main>
    </div>
  )
}
