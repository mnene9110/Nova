"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useUser, useFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { Loader2, MapPin } from "lucide-react"
import { getKenyanLocation } from "@/lib/location"

export default function FastOnboardingPage() {
  const [gender, setGender] = useState("")
  const [location, setLocation] = useState("Detecting...")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetecting, setIsDetecting] = useState(true)
  const router = useRouter()
  const { user } = useUser()
  const { firestore } = useFirebase()

  useEffect(() => {
    const detect = async () => {
      const loc = await getKenyanLocation();
      setLocation(loc);
      setIsDetecting(false);
    };
    detect();
  }, []);

  const handleConfirm = async () => {
    if (!user || !gender || isSubmitting || !firestore) return
    setIsSubmitting(true)

    try {
      const numericId = Math.floor(10000000 + Math.random() * 90000000);
      const welcomeCoins = 500;

      const profileData = {
        id: user.uid,
        numericId,
        authProviderId: "anonymous",
        username: `Guest_${user.uid.slice(0, 5)}`,
        gender,
        location: location || "Nairobi, Kenya",
        profilePhotoUrls: [`https://picsum.photos/seed/${user.uid}/600/800`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: serverTimestamp(),
        interests: ["Travel"],
        coinBalance: welcomeCoins,
        diamondBalance: 0,
        isAdmin: false,
        isCoinseller: false,
        isSupport: false,
        isAgent: false,
        dateOfBirth: "2000-01-01",
        isVerified: false,
        isOnline: true,
        agencyJoinStatus: "none"
      }

      await setDoc(doc(firestore, "userProfiles", user.uid), profileData);
      router.push("/discover")
    } catch (error) {
      console.error("Fast onboarding failed:", error)
      setIsSubmitting(false)
    }
  }

  const primaryBlueText = "text-sky-900";
  const primaryBlueBg = "bg-primary";

  return (
    <div className="flex flex-col min-h-svh bg-transparent p-8 overflow-y-auto">
      <div className="mt-12 space-y-10 flex-1 flex flex-col max-w-sm mx-auto w-full pb-20">
        <header className="space-y-3">
          <h1 className={cn("text-4xl font-black font-headline leading-tight drop-shadow-sm", primaryBlueText)}>Fast Setup</h1>
          <p className="text-sky-700 font-bold uppercase text-[10px] tracking-widest">Quickly set your basic info</p>
        </header>

        <div className="space-y-8 flex-1">
          <div className="space-y-4">
            <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", primaryBlueText)}>I am a</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
              <div 
                onClick={() => setGender("male")}
                className={cn(
                  "flex items-center space-x-3 bg-white border px-5 py-5 rounded-[2.25rem] flex-1 cursor-pointer transition-all shadow-sm",
                  gender === "male" ? "border-primary ring-1 ring-primary" : "border-gray-100"
                )}
              >
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className={cn("cursor-pointer font-black text-xs tracking-widest uppercase", gender === "male" ? "text-primary" : "text-gray-400")}>Man</Label>
              </div>
              <div 
                onClick={() => setGender("female")}
                className={cn(
                  "flex items-center space-x-3 bg-white border px-5 py-5 rounded-[2.25rem] flex-1 cursor-pointer transition-all shadow-sm",
                  gender === "female" ? "border-primary ring-1 ring-primary" : "border-gray-100"
                )}
              >
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className={cn("cursor-pointer font-black text-xs tracking-widest uppercase", gender === "female" ? "text-primary" : "text-gray-400")}>Woman</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className={cn("text-[10px] font-black uppercase tracking-[0.2em] ml-1", primaryBlueText)}>Your Location</Label>
            <div className="h-16 rounded-[2.25rem] bg-white border border-sky-100 flex items-center px-8 gap-3 shadow-sm">
              {isDetecting ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <MapPin className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm font-black text-gray-900">{location}</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Country is limited to Kenya</p>
          </div>
        </div>

        <Button 
          className={cn("w-full h-18 rounded-full text-white text-xl font-black mb-10 shadow-2xl active:scale-95 transition-all", primaryBlueBg)} 
          disabled={!gender || isDetecting || isSubmitting} 
          onClick={handleConfirm}
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm & Start"}
        </Button>
      </div>
    </div>
  )
}
