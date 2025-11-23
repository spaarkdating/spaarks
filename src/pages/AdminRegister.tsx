import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Heart, ArrowLeft, Lock, Mail, Key } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (!adminSecret.trim()) {
      toast({
        title: "Admin secret required",
        description: "Please enter the admin secret code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast({
          title: "Account already exists",
          description: "This email is already registered. Please log in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    // Verify admin secret code
    if (authData.user) {
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
          toast({
            title: "Admin verification failed",
            description: verifyData?.error || verifyError?.message || "Invalid admin secret code",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Admin account created successfully!",
          description: "Please check your email to verify your account. You now have admin privileges.",
        });
        
        // Clear form
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAdminSecret("");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } catch (err: any) {
        console.error("Error verifying admin:", err);
        toast({
          title: "Admin verification error",
          description: "Account created but admin verification failed. Contact support if you need admin access.",
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to home link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Shield className="h-12 w-12 text-purple-400" />
            <Heart className="h-5 w-5 text-pink-400 fill-pink-400 absolute -bottom-1 -right-1" />
          </div>
          <span className="text-4xl font-bold text-white">
            Spaark Admin
          </span>
        </div>

        <Card className="shadow-2xl border-2 border-purple-500/20 bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl text-white">Admin Registration</CardTitle>
            <CardDescription className="text-gray-400">
              Create an administrator account with elevated privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@spaark.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-purple-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-700">
                <div className="space-y-2">
                  <Label htmlFor="admin-secret" className="text-gray-200 flex items-center gap-2">
                    <Key className="h-4 w-4 text-pink-400" />
                    Admin Secret Code
                  </Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    placeholder="Enter your admin secret code"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-pink-500"
                  />
                  <div className="flex items-start gap-2 mt-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">
                      This code is provided only to authorized personnel. If you don't have access to this code, you are not authorized to create an admin account.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-purple-500/50 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Admin Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Create Admin Account
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link to="/auth" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Log in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Admin accounts have full access to user management, analytics, and platform settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
