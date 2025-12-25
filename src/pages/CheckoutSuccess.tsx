import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import { CheckCircle, Loader2, PartyPopper } from "lucide-react";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Get all PayU response parameters from URL
      const txnid = searchParams.get("txnid");
      const status = searchParams.get("status");
      const amount = searchParams.get("amount");
      const productinfo = searchParams.get("productinfo");
      const firstname = searchParams.get("firstname");
      const email = searchParams.get("email");
      const hash = searchParams.get("hash");
      const mihpayid = searchParams.get("mihpayid");
      const udf1 = searchParams.get("udf1");
      const udf2 = searchParams.get("udf2");
      const udf3 = searchParams.get("udf3");
      const udf4 = searchParams.get("udf4");
      const udf5 = searchParams.get("udf5");

      if (!txnid || !status) {
        throw new Error("Payment under review");
      }

      if (status !== "success") {
        throw new Error("Payment was not successful");
      }

      const { data, error } = await supabase.functions.invoke("payu-checkout", {
        body: {
          action: "verify_payment",
          txnid,
          status,
          amount,
          productinfo,
          firstname,
          email,
          hash,
          mihpayid,
          udf1,
          udf2,
          udf3,
          udf4,
          udf5,
        },
      });

      if (error) throw error;

      setVerified(true);
      toast({
        title: "Payment successful!",
        description: "Welcome to your new Spaark plan!",
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification under process",
        description: error.message || "Please contact support if you were charged.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Payment Success | Spaark" description="Your payment was successful" />
      <Header />

      <main className="container max-w-md mx-auto px-4 py-8 pt-24">
        <Card className="text-center">
          <CardHeader>
            {isVerifying ? (
              <>
                <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
                <CardTitle>Verifying Payment...</CardTitle>
                <CardDescription>Please wait while we confirm your payment</CardDescription>
              </>
            ) : verified ? (
              <>
                <div className="relative mx-auto mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <PartyPopper className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-bounce" />
                </div>
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                <CardDescription>Your subscription has been activated</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-destructive">Verification Pending</CardTitle>
                <CardDescription>
                  We are verifying your payment, it might take some time. If have any queries please contact support.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!isVerifying && (
              <Button className="w-full" onClick={() => navigate(verified ? "/dashboard" : "/support")}>
                {verified ? "Go to Dashboard" : "Contact Support"}
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
