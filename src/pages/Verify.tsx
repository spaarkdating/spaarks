import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!token_hash || type !== "email") {
        setStatus("error");
        setErrorMessage("Invalid verification link");
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        });

        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
        } else {
          setStatus("success");
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Verification failed");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-10 w-10 text-primary fill-primary" />
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Spaark
          </span>
        </Link>

        <Card className="shadow-2xl border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
              {status === "success" && <CheckCircle className="h-8 w-8 text-green-500" />}
              {status === "error" && <XCircle className="h-8 w-8 text-destructive" />}
              {status === "loading" && "Verifying..."}
              {status === "success" && "Success!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email"}
              {status === "success" && "Your email has been verified successfully"}
              {status === "error" && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the dashboard...
                </p>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                >
                  Go to Dashboard Now
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="text-center space-y-4">
                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Verify;
