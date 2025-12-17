import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IdCardStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const IdCardStep = ({ data, updateData, onNext }: IdCardStepProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(data.idCardUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/id-card-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('id-cards')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('id-cards')
        .getPublicUrl(fileName);

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
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all hover:border-primary hover:bg-primary/5
            ${preview ? 'border-green-500 bg-green-500/5' : 'border-muted-foreground/30'}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <span className="text-muted-foreground">Uploading...</span>
            </div>
          ) : preview ? (
            <div className="flex flex-col items-center gap-2">
              <FileCheck className="h-12 w-12 text-green-500" />
              <span className="text-green-600 font-medium">ID Card Uploaded</span>
              <span className="text-sm text-muted-foreground">Click to change</span>
              {preview.startsWith('blob:') && (
                <img 
                  src={preview} 
                  alt="ID Preview" 
                  className="mt-4 max-h-40 rounded-lg object-contain"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <span className="font-medium">Click to upload your ID card</span>
              <span className="text-sm text-muted-foreground">
                JPG, PNG, WebP or PDF (max 10MB)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium">Accepted ID Types:</h4>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>University/College Student ID Card</li>
          <li>School ID Card with photo</li>
          <li>Student enrollment card</li>
        </ul>
      </div>
    </div>
  );
};
