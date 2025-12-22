import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, User, LogOut, MessageSquare, Heart, Filter, Palette, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { SubscriptionManagement } from "@/components/settings/SubscriptionManagement";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [datingMode, setDatingMode] = useState<string>("online");
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(99);
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

      // Fetch user profile for dating mode and age preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("dating_mode, min_age, max_age")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        if (profile.dating_mode) setDatingMode(profile.dating_mode);
        if (profile.min_age) setMinAge(profile.min_age);
        if (profile.max_age) setMaxAge(profile.max_age);
      }
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

  const handleUpdateDatingMode = async (newMode: string) => {
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ dating_mode: newMode } as any)
      .eq("id", user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDatingMode(newMode);
      toast({
        title: "Dating mode updated",
        description: `Your dating mode has been changed to "${newMode}".`,
      });
    }
  };

  const handleUpdateAgeRange = async () => {
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        min_age: minAge,
        max_age: maxAge
      } as any)
      .eq("id", user.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Age range updated",
        description: `You will now see profiles aged ${minAge}-${maxAge}.`,
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

          {/* Subscription Management */}
          <SubscriptionManagement />

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Dating Preferences
              </CardTitle>
              <CardDescription>Choose how you want to meet people</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dating-mode">Dating Mode</Label>
                <Select value={datingMode} onValueChange={handleUpdateDatingMode} disabled={isLoading}>
                  <SelectTrigger id="dating-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Date Online</SelectItem>
                    <SelectItem value="offline">Date Offline</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You will only see profiles of users with the same dating mode preference
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how Spaark looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-xs text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Discovery Filters
              </CardTitle>
              <CardDescription>Set your age preferences for potential matches</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Age Range: {minAge} - {maxAge}</Label>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Minimum Age: {minAge}</Label>
                    <Slider
                      value={[minAge]}
                      onValueChange={(value) => setMinAge(value[0])}
                      min={18}
                      max={maxAge - 1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Age: {maxAge}</Label>
                    <Slider
                      value={[maxAge]}
                      onValueChange={(value) => setMaxAge(value[0])}
                      min={minAge + 1}
                      max={99}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleUpdateAgeRange} 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary"
                >
                  {isLoading ? "Updating..." : "Update Age Range"}
                </Button>
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

          <AccountManagementCard user={user} toast={toast} navigate={navigate} />

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Share Your Story
              </CardTitle>
              <CardDescription>Help others find love by sharing your success</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate("/submit-testimonial")}
              >
                <Heart className="h-4 w-4 mr-2" />
                Submit Testimonial
              </Button>
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

// Account Management Card Component with proper dialogs
const AccountManagementCard = ({ user, toast, navigate }: { user: any; toast: any; navigate: any }) => {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: "deactivated" } as any)
      .eq("id", user.id);

    if (!error) {
      toast({
        title: "Account deactivated",
        description: "Your account has been deactivated. Log in again anytime to reactivate.",
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
    setIsDeactivating(false);
    setShowDeactivateDialog(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT" || !understandConsequences) {
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account");
      
      if (error) throw error;

      toast({
        title: "Account Permanently Deleted",
        description: "Your account and all data have been permanently deleted. This email can no longer be used.",
      });

      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete account. Please contact support.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <Card className="shadow-xl border-2">
      <CardHeader>
        <CardTitle className="text-destructive">Account Management</CardTitle>
        <CardDescription>Manage your account status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Deactivate Account</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Your profile will be hidden from other users. You can reactivate anytime by logging back in.
          </p>
          <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              >
                Deactivate Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deactivate Your Account?</DialogTitle>
                <DialogDescription className="space-y-2 pt-2">
                  <p>When you deactivate your account:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your profile will be hidden from other users</li>
                    <li>You won't appear in anyone's swipes or matches</li>
                    <li>Your existing conversations will be preserved</li>
                    <li><strong>You can reactivate anytime by simply logging back in</strong></li>
                  </ul>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="default"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                >
                  {isDeactivating ? "Deactivating..." : "Yes, Deactivate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-2 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Permanently Delete Account
          </h4>
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-destructive font-medium mb-2">⚠️ Warning: This action is IRREVERSIBLE</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• All your data, photos, matches, and messages will be permanently deleted</li>
              <li>• <strong className="text-destructive">This email address can NEVER be used again</strong></li>
              <li>• You cannot recover your account or create a new one with the same email</li>
            </ul>
          </div>
          <Dialog open={showDeleteDialog} onOpenChange={(open) => {
            setShowDeleteDialog(open);
            if (!open) {
              setDeleteConfirmation("");
              setUnderstandConsequences(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Permanently Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Account Permanently
                </DialogTitle>
                <DialogDescription className="pt-2">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-destructive mb-2">This action CANNOT be undone!</p>
                    <ul className="text-xs space-y-1">
                      <li>• All your profile data will be erased</li>
                      <li>• All your photos will be deleted</li>
                      <li>• All your matches and messages will be lost</li>
                      <li>• <strong>Your email ({user.email}) will be permanently blocked</strong></li>
                      <li>• You can never create a new account with this email</li>
                    </ul>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="understand" 
                    checked={understandConsequences}
                    onCheckedChange={(checked) => setUnderstandConsequences(checked === true)}
                  />
                  <label htmlFor="understand" className="text-sm leading-tight cursor-pointer">
                    I understand that this action is permanent and my email can never be used again
                  </label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="text-sm">
                    Type <span className="font-mono font-bold text-destructive">DELETE MY ACCOUNT</span> to confirm:
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="font-mono"
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmation !== "DELETE MY ACCOUNT" || !understandConsequences}
                >
                  {isDeleting ? "Deleting..." : "Delete Forever"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
