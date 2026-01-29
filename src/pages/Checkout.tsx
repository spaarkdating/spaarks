import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import { DynamicUPIPayment } from "@/components/checkout/DynamicUPIPayment";
import {
  Check,
  Tag,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  Star,
  Building2,
  AlertCircle,
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

  // Payment state
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

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

  const handlePaymentSubmitted = () => {
    navigate("/checkout/success?method=manual");
  };


  const PlanIcon = plan.icon;
  const discount = calculateDiscount();
  const finalPrice = Math.max(0, plan.price - discount);

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

          {/* Payment Section - Dynamic UPI with auto-verification */}
          <div className="space-y-6">
            {user ? (
              <DynamicUPIPayment
                amount={finalPrice}
                planId={planId}
                userId={user.id}
                onPaymentSubmitted={handlePaymentSubmitted}
                paymentSettings={paymentSettings}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <p className="text-muted-foreground mb-4">Please login to continue with payment</p>
                  <Button onClick={() => navigate("/auth")}>Login to Pay</Button>
                </CardContent>
              </Card>
            )}

            {/* Bank Transfer Alternative */}
            {(paymentSettings?.bank_name || paymentSettings?.account_number) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                    Bank Transfer (Alternative)
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
