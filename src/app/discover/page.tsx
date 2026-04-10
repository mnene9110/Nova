"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { RotateCcw, Loader2, CheckCircle, Heart, ClipboardList } from "lucide-react"
import { useFirebase, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit, getDocs, doc } from "firebase/firestore"
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
      {/* Top Glass Buttons */}
      <div className="px-4 pt-10 pb-4 shrink-0">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push('/mystery-note')}
            className="group relative flex flex-col items-center justify-center aspect-[1.3/1] glass-card rounded-[2rem] native-shadow active:scale-100 transition-all overflow-hidden border-white/60"
          >
            <div className="absolute inset-0 bg-[#EB4C4C]/5 opacity-20" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#EB4C4C]/10 flex items-center justify-center border border-[#EB4C4C]/10">
                <Heart className="w-5 h-5 text-[#EB4C4C] fill-[#EB4C4C]/20" />
              </div>
              <span className="text-[12px] font-black text-gray-800 tracking-tight">Mystery Note</span>
            </div>
          </button>
          
          <button 
            onClick={() => router.push('/task-center')}
            className="group relative flex flex-col items-center justify-center aspect-[1.3/1] glass-card rounded-[2rem] native-shadow active:scale-100 transition-all overflow-hidden border-white/60"
          >
            <div className="absolute inset-0 bg-[#FD8A6B]/5 opacity-20" />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#FD8A6B]/10 flex items-center justify-center border border-[#FD8A6B]/10">
                <ClipboardList className="w-5 h-5 text-[#FD8A6B]" />
              </div>
              <span className="text-[12px] font-black text-gray-800 tracking-tight">Task Center</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recommended Header - Sticky with solid theme background */}
      <div className="sticky top-0 z-30 px-4 py-4 shrink-0 bg-[#FFC193]">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-black text-gray-800 tracking-tight ml-1">Recommended for you</h2>
          
          <button 
            onClick={handleRefresh} 
            disabled={isInitialLoading}
            className="w-9 h-9 rounded-full glass-card border-white/80 flex items-center justify-center active:rotate-180 transition-all duration-700 native-shadow text-gray-400 disabled:opacity-50"
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
      <main className="px-4 grid grid-cols-2 gap-2 pb-8 flex-1 mt-1">
        {mappedUsers.map((user) => (
          <div 
            key={user.id} 
            className="group relative aspect-[3/3.8] rounded-[1.75rem] overflow-hidden bg-white/40 native-shadow transition-all border border-white/20 cursor-pointer" 
            onClick={() => router.push(`/profile/${user.id}`)}
          >
            <div className="absolute inset-0 z-0">
              <Image 
                src={user.image} 
                alt={user.name} 
                fill 
                className="object-cover transition-transform duration-[1500ms]" 
                data-ai-hint="dating profile photo" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </div>

            {/* Chat Pill FAB - Top Right */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                router.push(`/chat/${user.id}`); 
              }}
              className="absolute top-3 right-3 h-7 px-3 bg-white/30 backdrop-blur-xl border border-white/30 shadow-lg rounded-full flex items-center justify-center z-10 transition-all active:scale-95"
            >
              <span className="text-[9px] font-black text-white uppercase tracking-wider">Chat</span>
            </button>

            {/* Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 z-10 pointer-events-none">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-white font-black text-[15px] tracking-tight truncate drop-shadow-md">
                    {user.name}
                  </h3>
                  {user.isVerified && (
                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
                      <CheckCircle className="w-3 h-3 text-black fill-current" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {/* Age Badge - Cyan */}
                  <div className="px-2 h-5 rounded-md bg-[#00E5FF] flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-black leading-none">{user.age}</span>
                  </div>
                  {/* Location/Distance Badge - Lime */}
                  <div className="px-2 h-5 rounded-md bg-[#C6FF00] flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-black uppercase tracking-tighter leading-none">{user.location.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isInitialLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/3.8] rounded-[1.75rem] bg-white/20 animate-pulse border border-white/10" />
        ))}
      </main>
    </div>
  )
}
