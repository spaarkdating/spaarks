import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/auditLog";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Loader2,
  User,
  Mail,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface IdCardVerification {
  id: string;
  user_id: string;
  card_url: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
}

export const IdCardVerification = () => {
  const [verifications, setVerifications] = useState<(IdCardVerification & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<IdCardVerification | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from("id_card_verifications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each verification
      const verificationsWithProfiles = await Promise.all(
        (data || []).map(async (v) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, display_name, email")
            .eq("id", v.user_id)
            .maybeSingle();
          return { ...v, profile };
        })
      );

      setVerifications(verificationsWithProfiles);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast({
        title: "Error",
        description: "Failed to load ID card verifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const loadIdCardImage = async (cardUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("id-cards")
        .createSignedUrl(cardUrl, 3600); // 1 hour expiry

      if (error) throw error;
      setImageUrl(data.signedUrl);
    } catch (error) {
      console.error("Error loading ID card:", error);
      setImageUrl(null);
    }
  };

  const handleViewCard = async (verification: IdCardVerification) => {
    setSelectedVerification(verification);
    await loadIdCardImage(verification.card_url);
    setViewDialogOpen(true);
  };

  const sendVerificationEmail = async (
    email: string,
    displayName: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { email, displayName, status, rejectionReason },
      });
      if (error) {
        console.error("Failed to send verification email:", error);
      } else {
        console.log(`Verification ${status} email sent to:`, email);
      }
    } catch (err) {
      console.error("Error invoking email function:", err);
    }
  };

  const handleApprove = async (verification: IdCardVerification) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user profile for email
      const verificationWithProfile = verifications.find(v => v.id === verification.id);
      const userEmail = verificationWithProfile?.profile?.email;
      const displayName = verificationWithProfile?.profile?.display_name || "User";

      // Update verification status
      const { error: verifyError } = await supabase
        .from("id_card_verifications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", verification.id);

      if (verifyError) throw verifyError;

      // Update profile verification status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "approved" })
        .eq("id", verification.user_id);

      if (profileError) throw profileError;

      await logAdminAction({
        actionType: "id_card_approved",
        targetUserId: verification.user_id,
        targetResourceId: verification.id,
        details: { action: "id_card_approved" },
      });

      // Send email notification
      if (userEmail) {
        await sendVerificationEmail(userEmail, displayName, "approved");
      }

      toast({
        title: "Approved",
        description: "User's ID card has been verified and notification email sent.",
      });

      setViewDialogOpen(false);
      fetchVerifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user profile for email
      const verificationWithProfile = verifications.find(v => v.id === selectedVerification.id);
      const userEmail = verificationWithProfile?.profile?.email;
      const displayName = verificationWithProfile?.profile?.display_name || "User";

      // Update verification status
      const { error: verifyError } = await supabase
        .from("id_card_verifications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedVerification.id);

      if (verifyError) throw verifyError;

      // Update profile verification status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "rejected" })
        .eq("id", selectedVerification.user_id);

      if (profileError) throw profileError;

      await logAdminAction({
        actionType: "id_card_rejected",
        targetUserId: selectedVerification.user_id,
        targetResourceId: selectedVerification.id,
        details: { reason: rejectionReason },
      });

      // Send email notification
      if (userEmail) {
        await sendVerificationEmail(userEmail, displayName, "rejected", rejectionReason);
      }

      toast({
        title: "Rejected",
        description: "User's ID card has been rejected and notification email sent.",
      });

      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason("");
      fetchVerifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject verification",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = verifications.filter(v => v.status === "pending").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ID Card Verifications</span>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} Pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No ID card verification requests yet.
            </p>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {verification.profile?.display_name || "Unknown User"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {verification.profile?.email || "No email"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        Submitted: {new Date(verification.submitted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(verification.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCard(verification)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review ID Card</DialogTitle>
            <DialogDescription>
              Verify the student ID card and approve or reject the account.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">User:</span>
                    <p className="font-medium">
                      {verifications.find(v => v.id === selectedVerification.id)?.profile?.display_name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>{getStatusBadge(selectedVerification.status)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <p className="font-medium">
                      {new Date(selectedVerification.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedVerification.reviewed_at && (
                    <div>
                      <span className="text-muted-foreground">Reviewed:</span>
                      <p className="font-medium">
                        {new Date(selectedVerification.reviewed_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                {selectedVerification.rejection_reason && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-muted-foreground text-sm">Rejection Reason:</span>
                    <p className="text-destructive">{selectedVerification.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">ID Card Image:</p>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Student ID Card"
                    className="max-h-96 w-full object-contain rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted rounded">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {selectedVerification.status !== "rejected" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectDialogOpen(true);
                    }}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {selectedVerification.status === "approved" ? "Change to Reject" : "Reject"}
                  </Button>
                )}
                {selectedVerification.status !== "approved" && (
                  <Button
                    onClick={() => handleApprove(selectedVerification)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {selectedVerification.status === "rejected" ? "Change to Approve" : "Approve"}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject ID Card</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this ID card. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
