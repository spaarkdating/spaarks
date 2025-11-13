import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, User, LogOut, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setEmail(user.email || "");
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === user?.email) {
      toast({
        title: "No changes",
        description: "The email address is the same as your current one.",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      email: email,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification email sent",
        description: "Check your new email address to confirm the change.",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
          </div>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>User ID</Label>
                <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded mt-1 break-all">
                  {user.id}
                </p>
              </div>
              
              <div>
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>Update your email address or resend verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing your email will require verification
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || email === user?.email}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                >
                  {isLoading ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="text-destructive">Account Management</CardTitle>
              <CardDescription>Manage your account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Deactivate Account</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Your profile will be hidden from other users. You can reactivate anytime by logging in.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to deactivate your account?")) {
                      const { error } = await supabase
                        .from("profiles")
                        .update({ account_status: "deactivated" })
                        .eq("id", user.id);

                      if (!error) {
                        toast({
                          title: "Account deactivated",
                          description: "Your account has been deactivated.",
                        });
                        await supabase.auth.signOut();
                        navigate("/");
                      } else {
                        toast({
                          title: "Error",
                          description: error.message,
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Deactivate Account
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2 text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all data. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
                      try {
                        // Delete profile (cascade will handle related data)
                        const { error } = await supabase
                          .from("profiles")
                          .delete()
                          .eq("id", user.id);

                        if (error) throw error;

                        toast({
                          title: "Account deleted",
                          description: "Your account has been permanently deleted.",
                        });

                        await supabase.auth.signOut();
                        navigate("/");
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: "Could not delete account. Please contact support.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  Permanently Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Contact our support team</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/support")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Sign Out
              </CardTitle>
              <CardDescription>End your current session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
