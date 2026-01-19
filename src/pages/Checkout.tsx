import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import {
  Check,
  Tag,
  Loader2,
  Shield,
  Upload,
  Copy,
  CheckCircle,
  Sparkles,
  Crown,
  Zap,
  Star,
  Smartphone,
  Building2,
  QrCode,
  AlertCircle,
  CreditCard,
  ExternalLink,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: React.ElementType;
}

const plans: Record<string, Plan> = {
  plus: {
    id: "plus",
    name: "Plus",
    price: 149,
    features: [
      "30 swipes per day",
      "Up to 15 active matches",
      "Unlimited text messaging",
      "See last 3 profile viewers",
      "1 image per chat per day",
    ],
    icon: Zap,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 249,
    features: [
      "Unlimited swipes",
      "Unlimited active matches",
      "Text + Voice messaging",
      "See last 10 profile viewers",
      "5 images per chat per day",
      "1 video per chat (15s)",
      "2 audio messages per day",
    ],
    icon: Crown,
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 399,
    features: [
      "Unlimited swipes",
      "Unlimited active matches",
      "Text + Voice + Video messaging",
      "See all profile viewers + timestamps",
      "Unlimited images",
      "Unlimited videos (30s)",
      "Unlimited audio messages",
      "Priority support",
    ],
    icon: Star,
  },
};

interface CouponData {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  code?: string;
  description?: string;
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

interface PaymentSettings {
  upi_id: string | null;
  upi_qr_url: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const planId = searchParams.get("plan") || "plus";
  const plan = plans[planId] || plans.plus;

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  // Payment proof state (for manual payment)
  const [transactionId, setTransactionId] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  
  // Instamojo payment state
  const [isProcessingInstamojo, setIsProcessingInstamojo] = useState(false);

  // Plan tier order for upgrade/downgrade check
  const planTiers: Record<string, number> = {
    free: 0,
    plus: 1,
    pro: 2,
    elite: 3,
  };

  useEffect(() => {
    checkUserAndFoundingStatus();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (error) throw error;
      setPaymentSettings(data);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const checkUserAndFoundingStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Check founding member status
      const { data: founderData } = await supabase
        .from("founding_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsFoundingMember(!!founderData);

      // Check current subscription
      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan, status, expires_at, cancelled_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (subData) {
        setCurrentPlan(subData.plan);
      }

      // Check for existing pending payment request
      const { data: existingReq } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      setExistingRequest(existingReq);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter coupon code",
        description: "Please enter a coupon code to apply.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to apply coupon.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsValidating(true);

    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: couponCode.trim(),
        p_plan: planId,
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data) throw new Error("No response from coupon validation");

      const couponData = data as unknown as CouponData;

      if (couponData.valid) {
        setAppliedCoupon(couponData);
        toast({
          title: "Coupon applied!",
          description:
            couponData.description ||
            `You saved ${couponData.discount_type === "percentage" ? `${couponData.discount_value}%` : `₹${couponData.discount_value}`}!`,
        });
      } else {
        toast({
          title: "Invalid coupon",
          description: couponData.error || "This coupon code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate coupon.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const calculateDiscount = () => {
    let discount = 0;

    if (isFoundingMember) {
      discount += plan.price * 0.2;
    }

    if (appliedCoupon?.valid) {
      const priceAfterFounder = plan.price - discount;
      if (appliedCoupon.discount_type === "percentage") {
        discount += priceAfterFounder * (appliedCoupon.discount_value! / 100);
      } else {
        discount += Math.min(appliedCoupon.discount_value!, priceAfterFounder);
      }
    }

    return Math.round(discount);
  };

  const getFinalPrice = () => {
    return Math.max(0, plan.price - calculateDiscount());
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
    toast({
      title: "Copied!",
      description: "UPI ID copied to clipboard",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if this is a downgrade (not allowed)
    if (currentPlan && planTiers[currentPlan] >= planTiers[planId]) {
      toast({
        title: "Downgrade not allowed",
        description: `You are already on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan. You can only upgrade to a higher tier plan.`,
        variant: "destructive",
      });
      return;
    }

    if (!transactionId.trim() && !upiReference.trim()) {
      toast({
        title: "Transaction details required",
        description: "Please enter your transaction ID or UPI reference number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let proofUrl = null;

      // Upload payment proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

        proofUrl = publicUrl;
      }

      // Create payment request
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        plan_type: planId,
        amount: getFinalPrice(),
        payment_proof_url: proofUrl,
        transaction_id: transactionId.trim() || null,
        upi_reference: upiReference.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Payment submitted!",
        description: "Your payment is under review. We'll activate your subscription within 24 hours.",
      });

      navigate("/checkout/success?method=manual");
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Instamojo payment
  const handleInstamojoPayment = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Check if this is a downgrade
    if (currentPlan && planTiers[currentPlan] >= planTiers[planId]) {
      toast({
        title: "Downgrade not allowed",
        description: `You are already on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessingInstamojo(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const response = await supabase.functions.invoke("instamojo-checkout", {
        body: {
          plan_type: planId,
          amount: finalPrice,
          coupon_id: appliedCoupon?.coupon_id,
          discount_amount: discount,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Payment initiation failed");

      // Redirect to Instamojo payment page
      window.location.href = response.data.longurl;
    } catch (error: any) {
      console.error("Instamojo error:", error);
      toast({
        title: "Payment initiation failed",
        description: error.message || "Unable to start payment. Please try manual payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingInstamojo(false);
    }
  };

  const PlanIcon = plan.icon;
  const discount = calculateDiscount();
  const finalPrice = getFinalPrice();

  // Show pending request message
  if (existingRequest) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Payment Pending | Spaark" description="Your payment is under review" />
        <Header />
        <main className="container max-w-2xl mx-auto px-4 py-8 pt-24">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <CardTitle>Payment Under Review</CardTitle>
              <CardDescription>
                You already have a pending payment request for the{" "}
                {existingRequest.plan_type.charAt(0).toUpperCase() + existingRequest.plan_type.slice(1)} plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                <p className="text-sm">
                  <strong>Amount:</strong> ₹{existingRequest.amount}
                </p>
                <p className="text-sm">
                  <strong>Submitted:</strong> {new Date(existingRequest.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong> <Badge variant="secondary">Pending Review</Badge>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Our team will review your payment within 24 hours. You'll be notified once your subscription is
                activated.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Check if user is trying to downgrade
  const isDowngrade = currentPlan && planTiers[currentPlan] >= planTiers[planId];
  const isSamePlan = currentPlan === planId;

  // Show downgrade warning
  if (isDowngrade) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Cannot Downgrade | Spaark" description="Upgrade your plan" />
        <Header />
        <main className="container max-w-2xl mx-auto px-4 py-8 pt-24">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle>{isSamePlan ? "Already on This Plan" : "Downgrades Not Allowed"}</CardTitle>
              <CardDescription>
                {isSamePlan 
                  ? `You are already subscribed to the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`
                  : `You are currently on the ${currentPlan!.charAt(0).toUpperCase() + currentPlan!.slice(1)} plan. You can only upgrade to a higher tier.`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isSamePlan 
                  ? "Your current plan is still active. No action needed."
                  : "To change to a lower tier, please wait until your current subscription expires or contact support."
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                {!isSamePlan && currentPlan !== "elite" && (
                  <Button onClick={() => navigate("/pricing")}>
                    View Higher Plans
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Checkout - ${plan.name} Plan | Spaark`} description="Complete your subscription to Spaark" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlanIcon className="h-5 w-5 text-primary" />
                {plan.name} Plan
              </CardTitle>
              <CardDescription>Monthly subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{plan.price}/month</span>
                </div>

                {isFoundingMember && (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Founding Member Discount (20%)
                    </span>
                    <span>-₹{Math.round(plan.price * 0.2)}</span>
                  </div>
                )}

                {appliedCoupon?.valid && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Coupon: {appliedCoupon.code}
                    </span>
                    <span>
                      -
                      {appliedCoupon.discount_type === "percentage"
                        ? `${appliedCoupon.discount_value}%`
                        : `₹${appliedCoupon.discount_value}`}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <div className="text-right">
                    {discount > 0 && (
                      <span className="text-sm text-muted-foreground line-through mr-2">₹{plan.price}</span>
                    )}
                    <span className="text-primary">₹{finalPrice}/month</span>
                  </div>
                </div>

                {discount > 0 && (
                  <Badge variant="secondary" className="w-full justify-center">
                    You save ₹{discount} this month!
                  </Badge>
                )}
              </div>

              {/* Coupon Section */}
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Apply Coupon
                </Label>
                {appliedCoupon?.valid ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">{appliedCoupon.code}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button onClick={handleApplyCoupon} disabled={isValidating} variant="outline">
                      {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <div className="space-y-6">
            <Tabs defaultValue="instant" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instant" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Instant Payment
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Manual Payment
                </TabsTrigger>
              </TabsList>

              {/* Instant Payment Tab - Instamojo */}
              <TabsContent value="instant" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Pay Instantly with Instamojo
                    </CardTitle>
                    <CardDescription>
                      Secure payment via UPI, Cards, Net Banking & Wallets
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>Secured by Instamojo - India's trusted payment gateway</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Instant activation - no manual verification needed</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span>Pay via UPI, Credit/Debit Cards, Net Banking, Wallets</span>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-primary">₹{finalPrice}</p>
                      <p className="text-sm text-muted-foreground">One-time payment for 30 days</p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent text-lg py-6"
                      onClick={handleInstamojoPayment}
                      disabled={isProcessingInstamojo}
                    >
                      {isProcessingInstamojo ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Initiating Payment...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-5 w-5 mr-2" />
                          Pay Now with Instamojo
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      You'll be redirected to Instamojo's secure payment page
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manual Payment Tab */}
              <TabsContent value="manual" className="mt-4 space-y-6">
                {/* UPI Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Pay via UPI
                    </CardTitle>
                    <CardDescription>Pay using any UPI app (GPay, PhonePe, Paytm, etc.)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentSettings?.upi_qr_url && (
                      <div className="flex justify-center">
                        <div className="w-48 h-48 border rounded-lg overflow-hidden bg-white p-2">
                          <img
                            src={paymentSettings.upi_qr_url}
                            alt="UPI QR Code"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <div className="bg-muted p-4 rounded-lg text-center">
                      {!paymentSettings?.upi_qr_url && (
                        <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm text-muted-foreground mb-2">
                        {paymentSettings?.upi_qr_url ? "Or use UPI ID" : "Scan or use UPI ID"}
                      </p>
                      {paymentSettings?.upi_id && (
                        <div className="flex items-center justify-center gap-2">
                          <code className="bg-background px-3 py-2 rounded text-lg font-mono">{paymentSettings.upi_id}</code>
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(paymentSettings.upi_id!)}>
                            {copiedUpi ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      <p className="text-lg font-bold text-primary mt-2">₹{finalPrice}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Bank Transfer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                      Bank Transfer
                    </CardTitle>
                    <CardDescription>Transfer directly to our bank account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      {paymentSettings?.bank_name && (
                        <p>
                          <strong>Bank:</strong> {paymentSettings.bank_name}
                        </p>
                      )}
                      {paymentSettings?.account_name && (
                        <p>
                          <strong>Account Name:</strong> {paymentSettings.account_name}
                        </p>
                      )}
                      {paymentSettings?.account_number && (
                        <p>
                          <strong>Account Number:</strong> {paymentSettings.account_number}
                        </p>
                      )}
                      {paymentSettings?.ifsc_code && (
                        <p>
                          <strong>IFSC Code:</strong> {paymentSettings.ifsc_code}
                        </p>
                      )}
                      <p className="text-primary font-bold pt-2">Amount: ₹{finalPrice}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Payment Proof */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Upload className="h-5 w-5 text-primary" />
                      Confirm Payment
                    </CardTitle>
                    <CardDescription>After payment, submit your transaction details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID / UTR Number</Label>
                      <Input
                        id="transactionId"
                        placeholder="Enter transaction ID"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upiReference">UPI Reference Number (Optional)</Label>
                      <Input
                        id="upiReference"
                        placeholder="Enter UPI reference"
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentProof">Payment Screenshot (Optional)</Label>
                      <Input
                        id="paymentProof"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      {paymentProof && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {paymentProof.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Your payment will be verified within 24 hours
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-primary to-secondary text-lg py-6"
                      onClick={handleSubmitPayment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Submit Payment for Review
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to our{" "}
              <Link to="/payment-terms" className="text-primary hover:underline">
                Payment Terms
              </Link>
              ,{" "}
              <Link to="/refund-policy" className="text-primary hover:underline">
                Refund Policy
              </Link>
              ,{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
