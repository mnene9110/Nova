"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Camera, Loader2, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const COUNTRIES = [
  "Burundi", "Comoros", "Djibouti", "Eritrea", "Ethiopia", "Kenya", 
  "Madagascar", "Malawi", "Mauritius", "Mozambique", "Nigeria", 
  "Rwanda", "Seychelles", "Somalia", "South Sudan", "Tanzania", 
  "Uganda", "Zambia", "Zimbabwe"
]

const HOROSCOPES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

const GOALS = ["Casual", "Long-term", "Friendship", "Networking"]

export default function EditProfilePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile, isLoading } = useDoc(userRef)

  const [formData, setFormData] = useState({
    username: "",
    dateOfBirth: "",
    location: "",
    relationshipGoal: "",
    education: "",
    horoscope: "",
    profilePhotoUrls: [] as string[]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        dateOfBirth: profile.dateOfBirth || "",
        location: profile.location || "",
        relationshipGoal: profile.relationshipGoal || "",
        education: profile.education || "",
        horoscope: profile.horoscope || "",
        profilePhotoUrls: profile.profilePhotoUrls || []
      })
      setPreviewImage(profile.profilePhotoUrls?.[0] || null)
    }
  }, [profile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setPreviewImage(dataUrl)
        setFormData(prev => ({ ...prev, profilePhotoUrls: [dataUrl] }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!currentUser || !firestore || isSaving) return
    setIsSaving(true)

    try {
      const userDocRef = doc(firestore, "userProfiles", currentUser.uid)
      
      // If photo changed, reset verification
      const photoChanged = profile?.profilePhotoUrls?.[0] !== formData.profilePhotoUrls[0]
      
      const updateData: any = {
        ...formData,
        updatedAt: new Date().toISOString()
      }

      if (photoChanged) {
        updateData.isVerified = false
      }

      updateDocumentNonBlocking(userDocRef, updateData)
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      })
      
      if (photoChanged) {
        toast({
          variant: "destructive",
          title: "Verification Revoked",
          description: "Photo change detected. Please verify again.",
        })
      }

      router.push("/profile")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save changes." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-transparent"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>

  return (
    <div className="flex flex-col min-h-svh bg-transparent text-gray-900 pb-32">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-transparent z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase text-white drop-shadow-sm">Edit Profile</h1>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto">
        <section className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-32 h-32 shadow-xl ring-4 ring-white/20">
              <AvatarImage src={previewImage || ""} className="object-cover" />
              <AvatarFallback className="bg-primary text-white text-3xl font-black">
                {formData.username?.[0] || <User className="w-12 h-12" />}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border-4 border-white shadow-lg active:scale-90 transition-transform"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mt-4">Change Profile Photo</p>
        </section>

        <section className="space-y-6 bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 shadow-sm">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Full Name</Label>
            <Input 
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm"
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Date of Birth</Label>
            <Input 
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Country</Label>
            <Select 
              value={formData.location} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, location: val }))}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Relationship Goal</Label>
            <Select 
              value={formData.relationshipGoal} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, relationshipGoal: val }))}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm">
                <SelectValue placeholder="What are you looking for?" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Education</Label>
            <Input 
              value={formData.education}
              onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
              className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm"
              placeholder="e.g. Bachelor's Degree"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Horoscope</Label>
            <Select 
              value={formData.horoscope} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, horoscope: val }))}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-white/60 border-none text-sm font-bold shadow-sm">
                <SelectValue placeholder="Your zodiac sign" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {HOROSCOPES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-16 rounded-full bg-primary text-white font-black text-lg gap-3 shadow-xl active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          Save Changes
        </Button>
      </footer>
    </div>
  )
}
