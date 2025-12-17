import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface VerificationPendingProps {
  status: "pending" | "rejected";
  rejectionReason?: string;
}

export const VerificationPending = ({ status, rejectionReason }: VerificationPendingProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Verification Rejected</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your student ID card verification was not approved.
            </p>
            {rejectionReason && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive">Reason:</p>
                <p className="text-sm text-muted-foreground mt-1">{rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Please contact support or try registering again with a valid student ID card.
            </p>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => window.open("/support", "_blank")} 
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button onClick={handleLogout} className="flex-1">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-xl">Verification Pending</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your student ID card is being reviewed by our team. This usually takes 24-48 hours.
          </p>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              You'll receive an email notification once your account is verified and ready to use.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleRefresh} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="flex-1">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
