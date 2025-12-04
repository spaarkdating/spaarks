import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Heart } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already">("loading");
  const [message, setMessage] = useState("");
  
  const email = searchParams.get("email");

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setStatus("error");
        setMessage("No email address provided.");
        return;
      }

      try {
        // Check if the email exists and is active
        const { data: subscription, error: fetchError } = await supabase
          .from("newsletter_subscriptions")
          .select("id, is_active")
          .eq("email", decodeURIComponent(email))
          .single();

        if (fetchError || !subscription) {
          setStatus("error");
          setMessage("This email is not subscribed to our newsletter.");
          return;
        }

        if (!subscription.is_active) {
          setStatus("already");
          setMessage("This email has already been unsubscribed.");
          return;
        }

        // Update the subscription to inactive
        const { error: updateError } = await supabase
          .from("newsletter_subscriptions")
          .update({ is_active: false })
          .eq("email", decodeURIComponent(email));

        if (updateError) {
          throw updateError;
        }

        setStatus("success");
        setMessage("You have been successfully unsubscribed from our newsletter.");
      } catch (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
        setMessage("An error occurred while processing your request. Please try again later.");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {status === "loading" && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
            {status === "already" && <CheckCircle className="h-8 w-8 text-muted-foreground" />}
            {status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Processing..."}
            {status === "success" && "Unsubscribed Successfully"}
            {status === "already" && "Already Unsubscribed"}
            {status === "error" && "Oops!"}
          </CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status !== "loading" && (
            <>
              <p className="text-sm text-muted-foreground">
                {status === "success" || status === "already" 
                  ? "We're sorry to see you go. You can always resubscribe from our website."
                  : "If you continue to receive emails, please contact our support team."
                }
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/">
                  <Button className="w-full gap-2">
                    <Heart className="h-4 w-4" />
                    Back to Spaark
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
