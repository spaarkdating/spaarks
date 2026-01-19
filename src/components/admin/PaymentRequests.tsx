import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
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
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  AlertTriangle,
  BadgeCheck,
  Search,
  Wifi
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

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

interface VerificationScore {
  score: number;
  level: "high" | "medium" | "low";
  reasons: string[];
}

// UTR patterns for different UPI apps
const UTR_PATTERNS = [
  /^[0-9]{12}$/, // Standard 12-digit UTR
  /^[A-Z]{4}[0-9]{8,14}$/, // Bank UTR format (e.g., AXIS20231215123456)
  /^[0-9]{16,22}$/, // Extended UTR
  /^[A-Za-z0-9]{8,25}$/, // Generic alphanumeric reference
];

const validateUTR = (utr: string | null): boolean => {
  if (!utr) return false;
  const cleanUtr = utr.trim().replace(/\s/g, "");
  return UTR_PATTERNS.some(pattern => pattern.test(cleanUtr));
};

const calculateVerificationScore = (request: PaymentRequest): VerificationScore => {
  let score = 0;
  const reasons: string[] = [];

  // Check if payment proof is provided (+30)
  if (request.payment_proof_url) {
    score += 30;
    reasons.push("✓ Payment proof uploaded");
  } else {
    reasons.push("✗ No payment proof");
  }

  // Check if UTR/Transaction ID is valid (+25)
  const hasValidUTR = validateUTR(request.upi_reference) || validateUTR(request.transaction_id);
  if (hasValidUTR) {
    score += 25;
    reasons.push("✓ Valid UTR/Transaction ID format");
  } else if (request.upi_reference || request.transaction_id) {
    score += 10;
    reasons.push("~ Reference provided but format uncertain");
  } else {
    reasons.push("✗ No transaction reference");
  }

  // Check payment timing - recent payments are more trustworthy (+20)
  const hoursAgo = differenceInHours(new Date(), new Date(request.created_at));
  if (hoursAgo < 1) {
    score += 20;
    reasons.push("✓ Very recent submission (<1 hour)");
  } else if (hoursAgo < 24) {
    score += 15;
    reasons.push("✓ Recent submission (<24 hours)");
  } else if (hoursAgo < 72) {
    score += 10;
    reasons.push("~ Submitted 1-3 days ago");
  } else {
    reasons.push("~ Older submission (>3 days)");
  }

  // Check if amount matches standard plan prices (+25)
  const standardPrices = [149, 249, 399]; // Plus, Pro, Elite
  if (standardPrices.includes(request.amount)) {
    score += 25;
    reasons.push("✓ Amount matches plan price");
  } else {
    score += 5;
    reasons.push("~ Custom amount (possibly with discount)");
  }

  // Determine level
  let level: "high" | "medium" | "low";
  if (score >= 75) {
    level = "high";
  } else if (score >= 50) {
    level = "medium";
  } else {
    level = "low";
  }

  return { score, level, reasons };
};

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
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(75);
  const [showVerificationDetails, setShowVerificationDetails] = useState<string | null>(null);
  const [verifyingUTR, setVerifyingUTR] = useState<string | null>(null);
  const [utrVerificationResults, setUtrVerificationResults] = useState<Record<string, any>>({});

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

  // UTR Verification function
  const verifyUTR = async (request: PaymentRequest) => {
    const utr = request.upi_reference || request.transaction_id;
    if (!utr) {
      toast({
        title: "No UTR found",
        description: "This payment request doesn't have a UTR/Transaction ID to verify.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingUTR(request.id);
    try {
      const { data, error } = await supabase.functions.invoke("verify-utr", {
        body: {
          utr: utr,
          amount: request.amount,
          paymentRequestId: request.id,
        },
      });

      if (error) throw error;

      setUtrVerificationResults(prev => ({
        ...prev,
        [request.id]: data,
      }));

      if (data.verified) {
        toast({
          title: "✓ UTR Verified",
          description: data.message,
        });
      } else if (data.status === "manual_required") {
        toast({
          title: "Manual verification required",
          description: `UTR format valid (${data.utrType}). Confidence: ${data.confidence}%`,
        });
      } else {
        toast({
          title: "Verification incomplete",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify UTR",
        variant: "destructive",
      });
    } finally {
      setVerifyingUTR(null);
    }
  };

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

  const handleAutoApproveHighConfidence = async () => {
    const highConfidenceRequests = requests.filter(r => {
      if (r.status !== "pending") return false;
      const verification = calculateVerificationScore(r);
      return verification.score >= autoApproveThreshold;
    });

    if (highConfidenceRequests.length === 0) {
      toast({
        title: "No eligible payments",
        description: `No pending payments meet the ${autoApproveThreshold}% confidence threshold`,
      });
      return;
    }

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const request of highConfidenceRequests) {
      try {
        await processApproval(request, `Auto-approved (${calculateVerificationScore(request).score}% confidence)`);
        successCount++;
      } catch (error) {
        failCount++;
        console.error("Failed to auto-approve:", request.id, error);
      }
    }

    toast({
      title: "Auto-Approval Complete",
      description: `${successCount} payments approved${failCount > 0 ? `, ${failCount} failed` : ""}`,
    });

    setBulkProcessing(false);
    fetchRequests();
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

  const getVerificationBadge = (verification: VerificationScore) => {
    if (verification.level === "high") {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
          <ShieldCheck className="h-3 w-3 mr-1" />
          {verification.score}% Verified
        </Badge>
      );
    } else if (verification.level === "medium") {
      return (
        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {verification.score}% Review
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          {verification.score}% Low
        </Badge>
      );
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const highConfidenceCount = pendingRequests.filter(r => 
    calculateVerificationScore(r).score >= autoApproveThreshold
  ).length;

  // Sort pending requests by verification score (highest first)
  const sortedRequests = [...requests].sort((a, b) => {
    if (a.status === "pending" && b.status === "pending") {
      return calculateVerificationScore(b).score - calculateVerificationScore(a).score;
    }
    return 0;
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Verification
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Semi-automated payment verification with confidence scoring
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Auto-Approve Section */}
        {filter === "pending" && pendingRequests.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    Smart Auto-Approve
                    <Badge variant="outline" className="text-xs">Beta</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {highConfidenceCount} payment{highConfidenceCount !== 1 ? 's' : ''} meet {autoApproveThreshold}%+ confidence threshold
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="threshold" className="text-sm whitespace-nowrap">Threshold:</Label>
                  <select
                    id="threshold"
                    value={autoApproveThreshold}
                    onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
                    className="h-8 px-2 rounded border bg-background text-sm"
                  >
                    <option value={90}>90%</option>
                    <option value={80}>80%</option>
                    <option value={75}>75%</option>
                    <option value={70}>70%</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleAutoApproveHighConfidence}
                  disabled={bulkProcessing || highConfidenceCount === 0}
                >
                  {bulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Auto-Approve ({highConfidenceCount})
                </Button>
              </div>
            </div>
          </div>
        )}
        
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
              {sortedRequests.map((request) => {
                const verification = calculateVerificationScore(request);
                return (
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
                              {request.status === "pending" && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => setShowVerificationDetails(
                                          showVerificationDetails === request.id ? null : request.id
                                        )}
                                        className="hover:opacity-80"
                                      >
                                        {getVerificationBadge(verification)}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium mb-1">Verification Score: {verification.score}%</p>
                                      <ul className="text-xs space-y-0.5">
                                        {verification.reasons.map((reason, i) => (
                                          <li key={i}>{reason}</li>
                                        ))}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
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

                        {/* Verification Details Expandable */}
                        {showVerificationDetails === request.id && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <BadgeCheck className="h-4 w-4" />
                              Verification Analysis
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {verification.reasons.map((reason, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  {reason.startsWith("✓") ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : reason.startsWith("✗") ? (
                                    <X className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                  )}
                                  <span>{reason.replace(/^[✓✗~]\s*/, "")}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      verification.level === "high" ? "bg-green-500" :
                                      verification.level === "medium" ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${verification.score}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{verification.score}%</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Transaction ID</p>
                            <p className={`font-mono text-xs truncate ${
                              validateUTR(request.transaction_id) ? "text-green-600" : ""
                            }`}>
                              {request.transaction_id || "—"}
                              {validateUTR(request.transaction_id) && (
                                <Check className="h-3 w-3 inline ml-1 text-green-500" />
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">UPI Reference</p>
                            <p className={`font-mono text-xs truncate ${
                              validateUTR(request.upi_reference) ? "text-green-600" : ""
                            }`}>
                              {request.upi_reference || "—"}
                              {validateUTR(request.upi_reference) && (
                                <Check className="h-3 w-3 inline ml-1 text-green-500" />
                              )}
                            </p>
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

                        {/* UTR Verification Result */}
                        {utrVerificationResults[request.id] && (
                          <div className={`mt-3 p-3 rounded-lg border ${
                            utrVerificationResults[request.id].verified 
                              ? "bg-green-500/10 border-green-500/30" 
                              : utrVerificationResults[request.id].status === "manual_required"
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-red-500/10 border-red-500/30"
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {utrVerificationResults[request.id].verified ? (
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                              ) : utrVerificationResults[request.id].status === "manual_required" ? (
                                <Wifi className="h-4 w-4 text-amber-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm font-medium">
                                Bank API Verification: {utrVerificationResults[request.id].status}
                              </span>
                              <Badge variant="outline" className="ml-auto">
                                {utrVerificationResults[request.id].confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {utrVerificationResults[request.id].message}
                            </p>
                            {utrVerificationResults[request.id].utrType && (
                              <p className="text-xs mt-1">
                                UTR Type: <Badge variant="secondary" className="text-xs">{utrVerificationResults[request.id].utrType}</Badge>
                              </p>
                            )}
                            <Progress 
                              value={utrVerificationResults[request.id].confidence} 
                              className="h-1.5 mt-2"
                            />
                          </div>
                        )}

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
                                  Approve
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
                                  Full Image
                                </a>
                              </Button>
                            )}
                            {(request.upi_reference || request.transaction_id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyUTR(request)}
                                disabled={verifyingUTR === request.id}
                              >
                                {verifyingUTR === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Search className="h-4 w-4 mr-1" />
                                )}
                                Verify UTR
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

export default PaymentRequests;
