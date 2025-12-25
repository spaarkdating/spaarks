import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/navigation/Header";
import SEO from "@/components/SEO";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function CheckoutFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorMessage = searchParams.get("error_Message") || "Your payment could not be processed";

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Payment Failed | Spaark" description="Your payment could not be processed" />
      <Header />

      <main className="container max-w-md mx-auto px-4 py-8 pt-24">
        <Card className="text-center">
          <CardHeader>
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-destructive">Payment verifying</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't worry, no money was deducted from your account. You can try again or choose a different payment
              method.
            </p>

            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={() => navigate(-1)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              <Button variant="outline" className="w-full" onClick={() => navigate("/pricing")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
