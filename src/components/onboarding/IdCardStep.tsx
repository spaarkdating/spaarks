import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileCheck, AlertCircle, Loader2, Camera, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IdCardStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const IdCardStep = ({ data, updateData, onNext }: IdCardStepProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(data.idCardUrl || null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP image or PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/id-card-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // For preview, create a local URL since the bucket is private
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      
      updateData({ 
        idCardUrl: fileName, // Store the path, not the full URL
        idCardUploaded: true 
      });

      toast({
        title: "ID card uploaded",
        description: "Your student ID card has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload ID card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      setCameraOpen(true);
      
      // Wait for dialog to open and video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (error: any) {
      console.error("Camera error:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to take a photo of your ID card.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast({
          title: "Capture failed",
          description: "Failed to capture photo. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create a file from the blob
      const file = new File([blob], `id-card-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Stop camera and close dialog
      stopCamera();
      
      // Upload the captured photo
      await uploadFile(file);
    }, 'image/jpeg', 0.9);
  }, [stopCamera, toast]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Student ID Verification</h3>
        <p className="text-muted-foreground">
          Upload your valid student ID card for verification. This helps us maintain a safe community.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your ID card will be reviewed by our team. Your account will be activated once verified.
          This usually takes 24-48 hours.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <Label>Upload Student ID Card</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Upload/Camera Options */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Upload File</span>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            disabled={uploading}
            className="h-auto py-4 flex flex-col items-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Take Photo</span>
          </Button>
        </div>

        {/* Preview Area */}
        {uploading ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center border-primary bg-primary/5">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="text-muted-foreground">Uploading...</span>
            </div>
          </div>
        ) : preview ? (
          <div className="border-2 border-dashed rounded-lg p-4 text-center border-green-500 bg-green-500/5">
            <div className="flex flex-col items-center gap-2">
              <FileCheck className="h-10 w-10 text-green-500" />
              <span className="text-green-600 font-medium">ID Card Uploaded</span>
              {preview.startsWith('blob:') && (
                <img 
                  src={preview} 
                  alt="ID Preview" 
                  className="mt-3 max-h-48 rounded-lg object-contain border border-border"
                />
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setPreview(null);
                  updateData({ idCardUrl: null, idCardUploaded: false });
                }}
                className="mt-2 text-muted-foreground hover:text-destructive"
              >
                Remove & Upload Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">
              Choose to upload a file or take a photo of your ID card
            </p>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium">Accepted ID Types:</h4>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>University/College Student ID Card</li>
          <li>School ID Card with photo</li>
          <li>Student enrollment card</li>
        </ul>
      </div>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Take Photo of ID Card</span>
              <Button variant="ghost" size="icon" onClick={stopCamera} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />
            
            {/* Camera overlay guide */}
            <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
            <p className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              Position ID card within frame
            </p>
          </div>
          
          <div className="p-4 flex justify-center">
            <Button
              onClick={capturePhoto}
              size="lg"
              className="rounded-full h-14 w-14 p-0 bg-primary hover:bg-primary/90"
            >
              <div className="w-10 h-10 rounded-full border-4 border-white" />
            </Button>
          </div>
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </div>
  );
};
