import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User as UserIcon, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Spaark
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Swipe Card */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Heart className="h-24 w-24 text-primary/50 fill-primary/50 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Start Swiping!</h3>
                  <p className="text-muted-foreground">
                    Discover amazing people nearby
                  </p>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">Welcome to Spaark!</h2>
                <p className="text-muted-foreground mb-4">Complete your profile to start matching</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-2 border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <span className="text-2xl">✕</span>
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground"
                  >
                    <Heart className="h-6 w-6 fill-current" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{user.email?.split("@")[0]}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                Complete Profile
              </Button>
            </div>

            {/* Matches Card */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Matches
                </h3>
                <span className="text-sm text-muted-foreground">0</span>
              </div>
              <p className="text-sm text-muted-foreground text-center py-4">
                Start swiping to get matches!
              </p>
            </div>

            {/* Messages Card */}
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-secondary" />
                  Messages
                </h3>
                <span className="text-sm text-muted-foreground">0</span>
              </div>
              <p className="text-sm text-muted-foreground text-center py-4">
                No messages yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
