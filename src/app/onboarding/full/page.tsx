"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useUser, useFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Loader2 } from "lucide-react"
import { getKenyanLocation } from "@/lib/location"

export default function FullOnboardingPage() {
  const [name, setName] = useState("")
  const [dob, setDob] = useState("")
  const [gender, setGender] = useState("")
  const [location, setLocation] = useState("Detecting...")
  const [isDetecting, setIsDetecting] = useState(true)
  const [lookingFor, setLookingFor] = useState("")
  
  const router = useRouter()
  const { user } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()

  useEffect(() => {
    const detect = async () => {
      const loc = await getKenyanLocation();
      setLocation(loc);
      setIsDetecting(false);
    };
    detect();
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !name || !dob || !gender || !lookingFor || !firestore) return

    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You must be 18 or older to use nova.",
      })
      return
    }

    const numericId = Math.floor(10000000 + Math.random() * 90000000);

    const profileData = {
      id: user.uid,
      numericId,
      authProviderId: "password",
      username: name,
      email: user.email,
      dateOfBirth: dob,
      gender,
      relationshipGoal: lookingFor,
      location: location || "Nairobi, Kenya",
      profilePhotoUrls: [`https://picsum.photos/seed/${user.uid}/600/800`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: serverTimestamp(),
      interests: ["Nature", "Adventure"],
      coinBalance: 500,
      diamondBalance: 0,
      isAdmin: false,
      isCoinseller: false,
      isSupport: false,
      isAgent: false,
      isVerified: false,
      isOnline: true,
      agencyJoinStatus: "none"
    }

    await setDoc(doc(firestore, "userProfiles", user.uid), profileData);
    router.push("/discover")
  }, [user, name, dob, gender, location, lookingFor, firestore, router, toast])

  const primaryBlueText = "text-sky-900";
  const primaryBlueBg = "bg-primary";

  return (
    <div className="h-svh bg-transparent overflow-y-auto">
      <div className="flex flex-col p-6 min-h-full">
        <div className="mt-8 space-y-8 pb-32 max-w-sm mx-auto w-full">
          <header className="space-y-2">
            <h1 className={cn("text-4xl font-black font-headline drop-shadow-sm", primaryBlueText)}>Complete Profile</h1>
            <p className="text-sky-700 font-bold uppercase text-[10px] tracking-[0.2em]">Tell us a bit more about yourself</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className={cn("text-[10px] font-black uppercase ml-1 tracking-widest", primaryBlueText)}>Full Name</Label>
              <Input 
                placeholder="What should we call you?" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-16 rounded-[2rem] bg-white border-none text-gray-900 font-bold px-6 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <Label className={cn("text-[10px] font-black uppercase ml-1 tracking-widest", primaryBlueText)}>Date of Birth</Label>
              <Input 
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-16 rounded-[2rem] bg-white border-none text-gray-900 font-bold px-6 shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <Label className={cn("text-[10px] font-black uppercase ml-1 tracking-widest", primaryBlueText)}>I am a</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                <div 
                  onClick={() => setGender("male")}
                  className={cn(
                    "flex items-center space-x-3 bg-white border px-5 py-4 rounded-[2rem] flex-1 cursor-pointer transition-all shadow-sm",
                    gender === "male" ? "border-primary ring-1" : "border-transparent"
                  )}
                >
                  <RadioGroupItem value="male" id="gender_male" />
                  <Label htmlFor="gender_male" className={cn("font-black cursor-pointer uppercase text-xs tracking-widest", gender === "male" ? "text-primary" : "text-gray-400")}>Man</Label>
                </div>
                <div 
                  onClick={() => setGender("female")}
                  className={cn(
                    "flex items-center space-x-3 bg-white border px-5 py-4 rounded-[2rem] flex-1 cursor-pointer transition-all shadow-sm",
                    gender === "female" ? "border-primary ring-1" : "border-transparent"
                  )}
                >
                  <RadioGroupItem value="female" id="gender_female" />
                  <Label htmlFor="gender_female" className={cn("font-black cursor-pointer uppercase text-xs tracking-widest", gender === "female" ? "text-primary" : "text-gray-400")}>Woman</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className={cn("text-[10px] font-black uppercase ml-1 tracking-widest", primaryBlueText)}>Looking for</Label>
              <RadioGroup value={lookingFor} onValueChange={setLookingFor} className="grid grid-cols-1 gap-2">
                {['long-term', 'casual', 'friendship'].map((goal) => (
                  <div 
                    key={goal} 
                    onClick={() => setLookingFor(goal)}
                    className={cn(
                      "flex items-center space-x-3 bg-white border px-5 py-4 rounded-[1.75rem] cursor-pointer transition-all shadow-sm",
                      lookingFor === goal ? "border-primary ring-1" : "border-transparent"
                    )}
                  >
                    <RadioGroupItem value={goal} id={`goal_${goal}`} />
                    <Label htmlFor={`goal_${goal}`} className={cn("font-black cursor-pointer uppercase text-[10px] tracking-widest", lookingFor === goal ? "text-primary" : "text-gray-400")}>
                      {goal.replace('-', ' ')}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className={cn("text-[10px] font-black uppercase ml-1 tracking-widest", primaryBlueText)}>Location (Kenya Only)</Label>
              <div className="h-16 rounded-[2rem] bg-white flex items-center px-6 gap-3 shadow-sm">
                {isDetecting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <MapPin className="w-4 h-4 text-primary" />
                )}
                <span className="text-sm font-bold text-gray-900">{location}</span>
              </div>
            </div>
          </div>

          <Button 
            className={cn("w-full h-18 rounded-full text-white text-xl font-black shadow-2xl active:scale-95 transition-all mt-6", primaryBlueBg)}
            disabled={!name || !dob || !gender || !lookingFor || isDetecting}
            onClick={handleSave}
          >
            Finish Setup
          </Button>
        </div>
      </div>
    </div>
  )
}
