
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Camera, RotateCcw, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { verifyFace } from "@/ai/flows/verify-face-flow"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function VerifyIdentityPage() {
  const router = useRouter()
  const { user: currentUser } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const userRef = useMemoFirebase(() => currentUser ? doc(firestore, "userProfiles", currentUser.uid) : null, [firestore, currentUser])
  const { data: profile } = useDoc(userRef)

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to verify your identity.',
        });
      }
    };

    getCameraPermission();

    return () => {
      // Disconnect camera access on unmount
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Mirror the image for capture as well to match preview
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const dataUri = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null);
  }

  const handleSubmit = async () => {
    if (!capturedImage || !profile || !currentUser) return;
    
    setIsVerifying(true);
    try {
      const profilePhoto = (profile.profilePhotoUrls && profile.profilePhotoUrls[0]) || "";
      
      const result = await verifyFace({
        profilePhotoUri: profilePhoto,
        livePhotoUri: capturedImage
      });

      if (result.isMatch) {
        const userDocRef = doc(firestore, "userProfiles", currentUser.uid);
        updateDocumentNonBlocking(userDocRef, {
          isVerified: true,
          updatedAt: new Date().toISOString()
        });
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified! A tick has been added to your profile.",
        });
        router.push('/profile');
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.actionableFeedback || "The photos do not match. Please ensure your profile photo is a clear picture of yourself.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during verification. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="flex flex-col min-h-svh bg-white text-gray-900">
      <header className="px-4 py-6 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="text-gray-900 h-10 w-10 bg-gray-50 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-black font-headline ml-4 tracking-widest uppercase">Verify Identity</h1>
      </header>

      <main className="flex-1 p-6 space-y-8 flex flex-col">
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black font-headline">Face Verification</h2>
          <p className="text-sm text-gray-500 font-medium">We'll compare a live photo with your profile picture to ensure authenticity.</p>
        </div>

        <div className="relative flex-1 min-h-[400px] w-full bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-50 flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover scale-x-[-1]" 
                autoPlay 
                muted 
                playsInline
              />
              <div className="absolute inset-0 border-[3px] border-white/20 rounded-[2.5rem] pointer-events-none m-8" />
            </>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
               <AlertCircle className="w-12 h-12 text-red-500" />
               <p className="text-sm font-bold uppercase tracking-widest">Camera Access Required</p>
               <Button onClick={() => window.location.reload()} variant="outline" className="border-white/20 text-white">Retry</Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="space-y-4">
          {!capturedImage ? (
            <Button 
              className="w-full h-16 rounded-full bg-zinc-900 text-white font-black text-lg gap-3 shadow-xl active:scale-95 transition-all"
              onClick={handleCapture}
              disabled={hasCameraPermission !== true}
            >
              <Camera className="w-6 h-6" />
              Capture Live Photo
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="h-16 rounded-full border-gray-100 font-black text-gray-500 gap-3"
                onClick={handleRetake}
                disabled={isVerifying}
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </Button>
              <Button 
                className="h-16 rounded-full bg-primary text-white font-black text-lg gap-3 shadow-xl active:scale-95 transition-all"
                onClick={handleSubmit}
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                {isVerifying ? "Verifying..." : "Submit"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
