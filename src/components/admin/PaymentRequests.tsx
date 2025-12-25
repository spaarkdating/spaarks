import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  CreditCard, 
  Check, 
  X, 
  ExternalLink, 
  Loader2,
  RefreshCw,
  User,
  Calendar,
  IndianRupee
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  payment_proof_url: string | null;
  transaction_id: string | null;
  upi_reference: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    email: string | null;
  };
}

export function PaymentRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("payment_requests")
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: PaymentRequest) => {
    setProcessingId(request.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update payment request status
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Create or update user subscription
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Check if user already has a subscription
      const { data: existingSub } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", request.user_id)
        .maybeSingle();

      let subError;
      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .update({
            plan: request.plan_type as "free" | "plus" | "pro" | "elite",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            cancelled_at: null,
          })
          .eq("user_id", request.user_id);
        subError = error;
      } else {
        // Insert new subscription
        const { error } = await supabase
          .from("user_subscriptions")
          .insert({
            user_id: request.user_id,
            plan: request.plan_type as "free" | "plus" | "pro" | "elite",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          });
        subError = error;
      }

      if (subError) throw subError;

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: request.user_id,
        type: "subscription",
        title: "Subscription Activated!",
        message: `Your ${request.plan_type.charAt(0).toUpperCase() + request.plan_type.slice(1)} plan is now active. Enjoy your premium features!`,
      });

      toast({
        title: "Payment Approved",
        description: "User subscription has been activated.",
      });

      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessingId(selectedRequest.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Notify user
      await supabase.from("notifications").insert({
        user_id: selectedRequest.user_id,
        type: "payment",
        title: "Payment Not Verified",
        message: adminNotes || "Your payment could not be verified. Please contact support.",
      });

      toast({
        title: "Payment Rejected",
        description: "User has been notified.",
      });

      setShowRejectDialog(false);
      setSelectedRequest(null);
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Requests
            </CardTitle>
            <CardDescription>
              Review and approve manual payment submissions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2 mt-4">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {filter === "all" ? "" : filter} payment requests found.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {request.profiles?.display_name || "Unknown User"}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.profiles?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-lg font-bold">
                      <IndianRupee className="h-4 w-4" />
                      {request.amount}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.plan_type.charAt(0).toUpperCase() + request.plan_type.slice(1)} Plan
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction ID</p>
                    <p className="font-mono">{request.transaction_id || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">UPI Reference</p>
                    <p className="font-mono">{request.upi_reference || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Proof</p>
                    {request.payment_proof_url ? (
                      <a
                        href={request.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary flex items-center gap-1 hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                </div>

                {request.admin_notes && (
                  <div className="bg-muted p-2 rounded text-sm">
                    <strong>Admin Notes:</strong> {request.admin_notes}
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Add notes (optional)"
                        value={selectedRequest?.id === request.id ? adminNotes : ""}
                        onChange={(e) => {
                          setSelectedRequest(request);
                          setAdminNotes(e.target.value);
                        }}
                        onFocus={() => setSelectedRequest(request)}
                      />
                    </div>
                    <Button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      disabled={processingId === request.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="e.g., Transaction ID not found, Amount mismatch, etc."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!adminNotes.trim() || processingId !== null}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reject Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
