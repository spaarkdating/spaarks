import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Heart, Mail } from "lucide-react";

const Unsubscribe = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">("idle");
  const [message, setMessage] = useState("");

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("loading");

    try {
      // Check if the email exists and is active
      const { data: subscription, error: fetchError } = await supabase
        .from("newsletter_subscriptions")
        .select("id, is_active")
        .eq("email", email.trim().toLowerCase())
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
        .eq("email", email.trim().toLowerCase());

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {status === "idle" && <Mail className="h-8 w-8 text-primary" />}
            {status === "loading" && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
            {status === "already" && <CheckCircle className="h-8 w-8 text-muted-foreground" />}
            {status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">
            {status === "idle" && "Unsubscribe from Newsletter"}
            {status === "loading" && "Processing..."}
            {status === "success" && "Unsubscribed Successfully"}
            {status === "already" && "Already Unsubscribed"}
            {status === "error" && "Oops!"}
          </CardTitle>
          <CardDescription className="text-base">
            {status === "idle" 
              ? "Enter your email address to unsubscribe from our newsletter."
              : message
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        {(status === "idle" || status === "error") && (
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Unsubscribe
              </Button>
            </form>
          )}
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">Please wait...</p>
          )}
          {(status === "success" || status === "already") && (
            <>
              <p className="text-sm text-muted-foreground">
                We're sorry to see you go. You can always resubscribe from our website.
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
