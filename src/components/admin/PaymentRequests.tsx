import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { 
  CreditCard, 
  Check, 
  X, 
  ExternalLink, 
  Loader2,
  RefreshCw,
  User,
  Clock,
  IndianRupee,
  CheckCheck,
  Eye,
  AlertCircle
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = useCallback(async () => {
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

      // Also fetch pending count
      const { count } = await supabase
        .from("payment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      setPendingCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time subscription for new payment requests
  useEffect(() => {
    const channel = supabase
      .channel("payment-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_requests" },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const sendPaymentNotification = async (
    email: string,
    name: string,
    type: "approved" | "rejected",
    planType: string,
    amount: number,
    reason?: string
  ) => {
    try {
      const response = await supabase.functions.invoke("send-payment-notification", {
        body: { email, name, type, planType, amount, reason },
      });
      
      if (response.error) {
        console.error("Failed to send email notification:", response.error);
      }
    } catch (error) {
      console.error("Error sending email notification:", error);
    }
  };

  const processApproval = async (request: PaymentRequest, notes: string = "") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Update payment request status
    const { error: updateError } = await supabase
      .from("payment_requests")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null,
      })
      .eq("id", request.id);

    if (updateError) throw updateError;

    // Create or update user subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", request.user_id)
      .maybeSingle();

    let subError;
    if (existingSub) {
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

    // Send email notification (fire and forget)
    if (request.profiles?.email) {
      sendPaymentNotification(
        request.profiles.email,
        request.profiles.display_name || "User",
        "approved",
        request.plan_type,
        request.amount
      );
    }
  };

  const handleQuickApprove = async (request: PaymentRequest) => {
    setProcessingIds(prev => new Set(prev).add(request.id));
    try {
      await processApproval(request);
      toast({
        title: "✓ Approved",
        description: `${request.profiles?.display_name || "User"}'s ${request.plan_type} plan activated`,
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    
    setBulkProcessing(true);
    const selectedRequests = requests.filter(r => selectedIds.has(r.id) && r.status === "pending");
    let successCount = 0;
    let failCount = 0;

    for (const request of selectedRequests) {
      try {
        await processApproval(request);
        successCount++;
      } catch (error) {
        failCount++;
        console.error("Failed to approve:", request.id, error);
      }
    }

    toast({
      title: "Bulk Approval Complete",
      description: `${successCount} approved${failCount > 0 ? `, ${failCount} failed` : ""}`,
    });

    setSelectedIds(new Set());
    setBulkProcessing(false);
    fetchRequests();
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessingIds(prev => new Set(prev).add(selectedRequest.id));
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

      await supabase.from("notifications").insert({
        user_id: selectedRequest.user_id,
        type: "payment",
        title: "Payment Not Verified",
        message: adminNotes || "Your payment could not be verified. Please contact support.",
      });

      if (selectedRequest.profiles?.email) {
        sendPaymentNotification(
          selectedRequest.profiles.email,
          selectedRequest.profiles.display_name || "User",
          "rejected",
          selectedRequest.plan_type,
          selectedRequest.amount,
          adminNotes
        );
      }

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
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(selectedRequest.id);
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingRequests = requests.filter(r => r.status === "pending");
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and approve manual payment submissions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(f);
                setSelectedIds(new Set());
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1 text-xs">({pendingCount})</span>
              )}
            </Button>
          ))}

          {filter === "pending" && pendingRequests.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {selectedIds.size === pendingRequests.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedIds.size > 0 && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleBulkApprove}
                  disabled={bulkProcessing}
                >
                  {bulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve Selected ({selectedIds.size})
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No {filter === "all" ? "" : filter} payment requests found.
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedIds.has(request.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  } ${request.status === "pending" ? 'border-amber-500/30 bg-amber-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {request.status === "pending" && (
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={() => toggleSelect(request.id)}
                        className="mt-1"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">
                              {request.profiles?.display_name || "Unknown User"}
                            </span>
                            {getStatusBadge(request.status)}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.profiles?.email}
                          </p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-lg font-bold">
                            <IndianRupee className="h-4 w-4" />
                            {request.amount}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            {request.plan_type} Plan
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Transaction ID</p>
                          <p className="font-mono text-xs truncate">{request.transaction_id || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">UPI Reference</p>
                          <p className="font-mono text-xs truncate">{request.upi_reference || "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Submitted</p>
                          <p className="text-xs">
                            {format(new Date(request.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Payment Proof</p>
                          {request.payment_proof_url ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => {
                                setProofUrl(request.payment_proof_url);
                                setShowProofDialog(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Proof
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      </div>

                      {request.admin_notes && (
                        <div className="bg-muted p-2 rounded text-xs mt-3">
                          <strong>Notes:</strong> {request.admin_notes}
                        </div>
                      )}

                      {request.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleQuickApprove(request)}
                            disabled={processingIds.has(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingIds.has(request.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Quick Approve
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes("");
                              setShowRejectDialog(true);
                            }}
                            disabled={processingIds.has(request.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          {request.payment_proof_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={request.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open Full
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Proof Preview Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {proofUrl && (
            <div className="flex items-center justify-center">
              <img
                src={proofUrl}
                alt="Payment proof"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={proofUrl || ""} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setAdminNotes("Transaction ID not found in our records")}
              >
                ID not found
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setAdminNotes("Payment amount does not match the plan price")}
              >
                Amount mismatch
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setAdminNotes("Payment proof is unclear or invalid")}
              >
                Invalid proof
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setAdminNotes("Duplicate payment submission")}
              >
                Duplicate
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!adminNotes.trim() || (selectedRequest && processingIds.has(selectedRequest.id))}
            >
              {selectedRequest && processingIds.has(selectedRequest.id) ? (
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
