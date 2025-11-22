import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSecret, setAdminSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setIsLoading(false);
      // Handle specific error for existing users
      if (error.message.includes("already registered")) {
        toast({
          title: "Account already exists",
          description: "Please log in instead or use a different email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    // If registering as admin, verify the secret code
    if (isAdmin && authData.user) {
      try {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          "verify-admin-registration",
          {
            body: {
              secretCode: adminSecret,
              userId: authData.user.id,
              email: email,
            },
          }
        );

        if (verifyError || (verifyData && verifyData.error)) {
          // Admin verification failed - show error but account is still created
          toast({
            title: "Admin registration failed",
            description: verifyData?.error || verifyError?.message || "Invalid admin secret code",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Admin account created!",
            description: "Please check your email to verify your account. You now have admin privileges.",
          });
        }
      } catch (err: any) {
        console.error("Error verifying admin:", err);
        toast({
          title: "Admin verification error",
          description: "Account created but admin verification failed. Contact support if you need admin access.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before logging in.",
      });
    }

    setIsLoading(false);
    // Clear form
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAdminSecret("");
    setIsAdmin(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Check if user is admin
    if (data.user) {
      const { data: adminData } = await (supabase as any)
        .from("admin_users")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      setIsLoading(false);

      if (adminData) {
        // Redirect admin users to admin dashboard
        navigate("/admin");
      } else {
        // Redirect regular users to regular dashboard
        navigate("/dashboard");
      }
    }
  };


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
            <CardTitle className="text-3xl">Welcome!</CardTitle>
            <CardDescription>Sign in or create an account to find your match</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Admin Registration Option */}
                  <div className="space-y-4 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin-checkbox"
                        checked={isAdmin}
                        onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
                      />
                      <Label
                        htmlFor="admin-checkbox"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Register as Admin
                      </Label>
                    </div>
                    
                    {isAdmin && (
                      <div className="space-y-2 animate-fade-in">
                        <Label htmlFor="admin-secret">Admin Secret Code</Label>
                        <Input
                          id="admin-secret"
                          type="password"
                          placeholder="Enter admin secret code"
                          value={adminSecret}
                          onChange={(e) => setAdminSecret(e.target.value)}
                          required={isAdmin}
                        />
                        <p className="text-xs text-muted-foreground">
                          Only authorized personnel should have access to the admin secret code.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to Spaark's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
