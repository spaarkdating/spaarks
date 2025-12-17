import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Mail, AlertCircle, Upload, FileCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface VerificationPendingProps {
  status: "pending" | "rejected";
  rejectionReason?: string;
}

export const VerificationPending = ({ status, rejectionReason }: VerificationPendingProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

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

      // For preview, create a local URL since the bucket is private
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);
      setUploadedPath(fileName);

      toast({
        title: "ID card uploaded",
        description: "Click 'Submit for Review' to resubmit your verification.",
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

  const handleSubmitReview = async () => {
    if (!uploadedPath) {
      toast({
        title: "No file selected",
        description: "Please upload your ID card first.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create a new verification record
      const { error: insertError } = await supabase
        .from("id_card_verifications")
        .insert({
          user_id: user.id,
          card_url: uploadedPath,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Update profile verification status to pending
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast({
        title: "Resubmitted successfully!",
        description: "Your ID card has been resubmitted for review. You'll be notified once verified.",
      });

      setResubmitOpen(false);
      
      // Refresh the page to show pending status
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Resubmit error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to resubmit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "rejected") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Verification Rejected</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your student ID card verification was not approved.
              </p>
              {rejectionReason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive">Reason:</p>
                  <p className="text-sm text-muted-foreground mt-1">{rejectionReason}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                You can resubmit a new ID card or contact support for assistance.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => setResubmitOpen(true)} 
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Resubmit ID Card
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open("/support", "_blank")} 
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="ghost" onClick={handleLogout} className="flex-1">
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resubmit Dialog */}
        <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resubmit ID Card</DialogTitle>
              <DialogDescription>
                Upload a clear photo of your valid student ID card. Make sure all details are visible.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-all hover:border-primary hover:bg-primary/5
                  ${preview ? 'border-green-500 bg-green-500/5' : 'border-muted-foreground/30'}
                `}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="text-muted-foreground">Uploading...</span>
                  </div>
                ) : preview ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileCheck className="h-10 w-10 text-green-500" />
                    <span className="text-green-600 font-medium">ID Card Ready</span>
                    <span className="text-sm text-muted-foreground">Click to change</span>
                    {preview.startsWith('blob:') && (
                      <img 
                        src={preview} 
                        alt="ID Preview" 
                        className="mt-3 max-h-32 rounded-lg object-contain"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="font-medium">Click to upload</span>
                    <span className="text-sm text-muted-foreground">
                      JPG, PNG, WebP or PDF (max 10MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <h4 className="font-medium text-sm">Tips for approval:</h4>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  <li>Ensure your photo and name are clearly visible</li>
                  <li>Make sure the ID is not expired</li>
                  <li>Avoid glare or blur in the photo</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setResubmitOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitReview} 
                disabled={!uploadedPath || submitting}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-xl">Verification Pending</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your student ID card is being reviewed by our team. This usually takes 24-48 hours.
          </p>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              You'll receive an email notification once your account is verified and ready to use.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleRefresh} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="flex-1">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};