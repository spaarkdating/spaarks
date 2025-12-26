import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import { CheckCircle, Clock, PartyPopper } from "lucide-react";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const method = searchParams.get("method");

  // Manual payment submission
  const isManualPayment = method === "manual";

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Payment Submitted | Spaark" description="Your payment has been submitted" />
      <Header />

      <main className="container max-w-md mx-auto px-4 py-8 pt-24">
        <Card className="text-center">
          <CardHeader>
            {isManualPayment ? (
              <>
                <div className="relative mx-auto mb-4">
                  <Clock className="h-16 w-16 text-yellow-500" />
                  <CheckCircle className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1" />
                </div>
                <CardTitle className="text-yellow-600">Payment Under Review</CardTitle>
                <CardDescription>
                  Your payment details have been submitted successfully
                </CardDescription>
              </>
            ) : (
              <>
                <div className="relative mx-auto mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <PartyPopper className="h-8 w-8 text-primary absolute -top-2 -right-2 animate-bounce" />
                </div>
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                <CardDescription>Your subscription has been activated</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isManualPayment ? (
              <>
                <div className="bg-muted p-4 rounded-lg text-left space-y-2 text-sm">
                  <p>
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Our team will verify your payment within 24 hours</li>
                    <li>You'll receive a notification once verified</li>
                    <li>Your subscription will be activated automatically</li>
                  </ul>
                </div>
                <Button className="w-full" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/support")}>
                  Contact Support
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
