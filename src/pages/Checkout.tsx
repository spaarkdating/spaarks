import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import { Check, Tag, Loader2, Shield, CreditCard, Sparkles, Crown, Zap, Star } from "lucide-react";

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

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const planId = searchParams.get("plan") || "plus";
  const plan = plans[planId] || plans.plus;
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [payuData, setPayuData] = useState<any>(null);

  useEffect(() => {
    checkUserAndFoundingStatus();
  }, []);

  const checkUserAndFoundingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data } = await supabase
        .from("founding_members")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      setIsFoundingMember(!!data);
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
          description: couponData.description || `You saved ${couponData.discount_type === "percentage" ? `${couponData.discount_value}%` : `₹${couponData.discount_value}`}!`,
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
    
    // Founding member discount (20%)
    if (isFoundingMember) {
      discount += plan.price * 0.2;
    }
    
    // Coupon discount
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

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      const baseUrl = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke("payu-checkout", {
        body: {
          action: "create_payment",
          plan: planId,
          coupon_code: appliedCoupon?.code || null,
          success_url: `${baseUrl}/checkout/success`,
          failure_url: `${baseUrl}/checkout/failure`,
        },
      });

      if (error) throw error;

      // Store PayU data and submit form
      setPayuData(data);
      
      // Create and submit PayU form
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.submit();
        }
      }, 100);

    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const PlanIcon = plan.icon;
  const discount = calculateDiscount();
  const finalPrice = getFinalPrice();

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Checkout - ${plan.name} Plan | Spaark`} description="Complete your subscription to Spaark" />
      <Header />
      
      {/* Hidden PayU form */}
      {payuData && (
        <form 
          ref={formRef}
          action="https://secure.payu.in/_payment" 
          method="POST" 
          style={{ display: 'none' }}
        >
          <input type="hidden" name="key" value={payuData.key} />
          <input type="hidden" name="txnid" value={payuData.txnid} />
          <input type="hidden" name="amount" value={payuData.amount} />
          <input type="hidden" name="productinfo" value={payuData.productinfo} />
          <input type="hidden" name="firstname" value={payuData.firstname} />
          <input type="hidden" name="email" value={payuData.email} />
          <input type="hidden" name="phone" value={payuData.phone || ""} />
          <input type="hidden" name="surl" value={payuData.surl} />
          <input type="hidden" name="furl" value={payuData.furl} />
          <input type="hidden" name="hash" value={payuData.hash} />
          <input type="hidden" name="udf1" value={payuData.udf1} />
          <input type="hidden" name="udf2" value={payuData.udf2} />
          <input type="hidden" name="udf3" value={payuData.udf3} />
          <input type="hidden" name="udf4" value={payuData.udf4} />
          <input type="hidden" name="udf5" value={payuData.udf5} />
          <input type="hidden" name="service_provider" value="payu_paisa" />
        </form>
      )}
      
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
                      -{appliedCoupon.discount_type === "percentage" 
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
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        ₹{plan.price}
                      </span>
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
            </CardContent>
          </Card>

          {/* Coupon & Payment */}
          <div className="space-y-6">
            {/* Coupon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5 text-primary" />
                  Apply Coupon
                </CardTitle>
                <CardDescription>
                  Have a promo code? Enter it below
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appliedCoupon?.valid ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        {appliedCoupon.code}
                      </span>
                      {appliedCoupon.description && (
                        <span className="text-sm text-green-600">
                          - {appliedCoupon.description}
                        </span>
                      )}
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
                    <Button 
                      onClick={handleApplyCoupon} 
                      disabled={isValidating}
                      variant="outline"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment
                </CardTitle>
                <CardDescription>
                  Secure payment powered by PayU
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Your payment is secure and encrypted
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary text-lg py-6"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ₹{finalPrice}
                    </>
                  )}
                </Button>
                
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
                  </Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
