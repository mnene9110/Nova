"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Camera, Loader2, Save, User, Plus, X, MapPin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser, useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { getKenyanLocation } from "@/lib/location"

const INTERESTS_OPTIONS = [
  'Music', 'Travel', 'Sports', 'Movies', 'Gaming', 'Cooking', 
  'Reading', 'Art', 'Dancing', 'Tech', 'Fashion', 'Fitness', 
  'Photography', 'Nature', 'Coffee', 'Pets'
]

const EDUCATION_OPTIONS = [
  'High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 
  'Doctorate', 'Self-taught', 'Vocational Training'
]

const LOOKING_FOR_OPTIONS = [
  { id: 'long-term', label: 'Long-term' },
  { id: 'casual', label: 'Casual' },
  { id: 'friendship', label: 'Friendship' },
  { id: 'marriage', label: 'Marriage' }
]

const ZODIAC_OPTIONS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

export default function EditProfilePage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { firestore } = useFirebase()
  const { toast } = useToast()
  
  const mainFileInputRef = useRef<HTMLInputElement>(null)
  const extraPhotosInputRef = useRef<HTMLInputElement>(null)
  
  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile, isLoading } = useDoc(userRef)

  const [activePhotoSlot, setActivePhotoSlot] = useState<number | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    location: "",
    profilePhotoUrls: [] as string[],
    interests: [] as string[],
    education: "",
    relationshipGoal: "",
    horoscope: ""
  })
  
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        profilePhotoUrls: profile.profilePhotoUrls || [],
        interests: profile.interests || [],
        education: profile.education || "",
        relationshipGoal: profile.relationshipGoal || "",
        horoscope: profile.horoscope || ""
      })
    }
  }, [profile])

  const onCropComplete = useCallback((_area: any, pixels: any) => setCroppedAreaPixels(pixels), [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activePhotoSlot !== null) {
      const reader = new FileReader()
      reader.onloadend = () => setImageToCrop(reader.result as string)
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const getCroppedImg = async () => {
    if (!imageToCrop || !croppedAreaPixels) return null;
    const image = new window.Image(); image.src = imageToCrop;
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = croppedAreaPixels.width; canvas.height = croppedAreaPixels.height;
    ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  const handleApplyCrop = async () => {
    setIsCropping(true)
    try {
      const croppedImage = await getCroppedImg()
      if (croppedImage && activePhotoSlot !== null) {
        setFormData(prev => {
          const newUrls = [...prev.profilePhotoUrls]; 
          if (activePhotoSlot < newUrls.length) {
            newUrls[activePhotoSlot] = croppedImage;
          } else {
            // Grow array to match slot if needed
            while (newUrls.length <= activePhotoSlot) {
              newUrls.push("");
            }
            newUrls[activePhotoSlot] = croppedImage;
          }
          return { ...prev, profilePhotoUrls: newUrls.filter(u => u !== "" || newUrls.indexOf(u) === 0) }
        });
        setImageToCrop(null); setActivePhotoSlot(null);
      }
    } catch (e) { toast({ variant: "destructive", title: "Error" }) } finally { setIsCropping(false) }
  }

  const removePhoto = (index: number) => {
    if (index === 0) { toast({ title: "Primary Photo Required" }); return }
    setFormData(prev => {
      const newUrls = [...prev.profilePhotoUrls]; 
      newUrls.splice(index, 1);
      return { ...prev, profilePhotoUrls: newUrls }
    })
  }

  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest].slice(0, 5) // Limit to 5
      return { ...prev, interests: newInterests }
    })
  }

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    const loc = await getKenyanLocation();
    setFormData(prev => ({ ...prev, location: loc }));
    setIsDetectingLocation(false);
    toast({ title: "Location Updated", description: `Resolved to ${loc}` });
  }

  const handleSave = async () => {
    if (!currentUser || !firestore || isSaving) return
    setIsSaving(true)
    try {
      await updateDoc(doc(firestore, "userProfiles", currentUser.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      })
      toast({ title: "Profile Updated" })
      router.push("/profile")
    } catch (error) { toast({ variant: "destructive", title: "Error" }); setIsSaving(false) }
  }

  if (isLoading) return <div className="flex h-svh items-center justify-center bg-transparent"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>

  const extraPhotoSlots = [1, 2, 3, 4]

  return (
    <div className="flex flex-col h-svh bg-transparent text-gray-900 overflow-hidden">
      <header className="shrink-0 px-4 py-8 flex items-center bg-transparent z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white h-10 w-10 bg-black/10 backdrop-blur-md rounded-full"><ChevronLeft className="w-6 h-6" /></Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase text-white drop-shadow-md">Edit Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-2 pb-40 space-y-10 scroll-smooth">
        <section className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-40 h-40 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border-4 border-white">
                <AvatarImage src={formData.profilePhotoUrls[0] || ""} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-4xl font-black">{formData.username?.[0] || <User className="w-16 h-16" />}</AvatarFallback>
              </Avatar>
              <button onClick={() => { setActivePhotoSlot(0); mainFileInputRef.current?.click(); }} className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center shadow-xl active:scale-90 transition-transform z-10"><Camera className="w-5 h-5 text-white" /></button>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-950/60 mt-5 drop-shadow-sm">Main Profile Photo</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-950/40 ml-1">Profile Gallery</h3>
            <div className="grid grid-cols-4 gap-3">
              {extraPhotoSlots.map((slotIndex) => {
                const photoUrl = formData.profilePhotoUrls[slotIndex];
                return (
                  <div key={slotIndex} className="relative aspect-square">
                    {photoUrl ? (
                      <>
                        <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white shadow-lg"><Image src={photoUrl} alt="Extra" fill className="object-cover" /></div>
                        <button onClick={() => removePhoto(slotIndex)} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-all z-20"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { setActivePhotoSlot(slotIndex); extraPhotosInputRef.current?.click(); }} 
                        className="w-full h-full rounded-2xl border-2 border-dashed border-white bg-white/60 flex items-center justify-center shadow-sm hover:bg-white hover:border-primary/30 active:scale-95 transition-all group"
                      >
                        <Plus className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-[9px] font-bold text-sky-950/30 uppercase tracking-widest text-center">Add up to 4 extra photos</p>
          </div>
          <input type="file" ref={mainFileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          <input type="file" ref={extraPhotosInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </section>

        <section className="space-y-6 bg-white/60 backdrop-blur-2xl p-7 rounded-[2.5rem] border border-white/50 shadow-2xl">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Full Name</Label>
            <Input value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} className="h-14 rounded-2xl bg-white/80 border-none text-sm font-bold shadow-inner" />
          </div>
          
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Bio</Label>
            <Textarea value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="min-h-[120px] rounded-2xl bg-white/80 border-none text-sm font-bold shadow-inner py-4" />
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Current Location (Kenya Only)</Label>
            <div className="flex gap-2">
              <div className="flex-1 h-14 rounded-2xl bg-white/80 border-none px-4 flex items-center gap-3 shadow-inner">
                <MapPin className="w-4 h-4 text-primary/40" />
                <span className="text-sm font-bold text-gray-900 truncate">{formData.location || "Detecting..."}</span>
              </div>
              <Button 
                onClick={handleDetectLocation} 
                disabled={isDetectingLocation}
                variant="ghost" 
                size="icon" 
                className="h-14 w-14 rounded-2xl bg-white/80 text-primary shadow-inner"
              >
                <RefreshCw className={cn("w-5 h-5", isDetectingLocation && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Looking For</Label>
            <Select value={formData.relationshipGoal} onValueChange={(val) => setFormData(prev => ({ ...prev, relationshipGoal: val }))}>
              <SelectTrigger className="h-14 rounded-2xl bg-white/80 border-none text-sm font-bold shadow-inner"><SelectValue placeholder="What are you seeking?" /></SelectTrigger>
              <SelectContent className="rounded-2xl">{LOOKING_FOR_OPTIONS.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Education</Label>
            <Select value={formData.education} onValueChange={(val) => setFormData(prev => ({ ...prev, education: val }))}>
              <SelectTrigger className="h-14 rounded-2xl bg-white/80 border-none text-sm font-bold shadow-inner"><SelectValue placeholder="Level of education" /></SelectTrigger>
              <SelectContent className="rounded-2xl">{EDUCATION_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Zodiac Sign</Label>
            <Select value={formData.horoscope} onValueChange={(val) => setFormData(prev => ({ ...prev, horoscope: val }))}>
              <SelectTrigger className="h-14 rounded-2xl bg-white/80 border-none text-sm font-bold shadow-inner"><SelectValue placeholder="Your star sign" /></SelectTrigger>
              <SelectContent className="rounded-2xl">{ZODIAC_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between ml-1">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Interests (Max 5)</Label>
              <span className="text-[9px] font-black text-gray-400">{formData.interests.length}/5</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map(interest => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button 
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                      isSelected 
                        ? "bg-primary text-white border-primary" 
                        : "bg-white/50 text-gray-500 border-gray-100 hover:bg-white"
                    )}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="shrink-0 fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-sm z-50">
        <div className="max-w-md mx-auto"><Button onClick={handleSave} disabled={isSaving} className="w-full h-16 rounded-full bg-primary text-white font-black text-lg gap-3 shadow-xl">{isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}Save Changes</Button></div>
      </footer>

      <Dialog open={!!imageToCrop} onOpenChange={(open) => !open && !isCropping && setImageToCrop(null)}>
        <DialogContent className="rounded-[2.5rem] bg-white border-none p-0 max-w-[95%] mx-auto shadow-2xl overflow-hidden">
          <div className="relative w-full aspect-square bg-zinc-950">{imageToCrop && <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />}</div>
          <div className="p-6 space-y-6"><input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" /><DialogFooter className="flex gap-3"><Button variant="ghost" onClick={() => setImageToCrop(null)} className="flex-1">Cancel</Button><Button onClick={handleApplyCrop} className="flex-1">Apply</Button></DialogFooter></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
