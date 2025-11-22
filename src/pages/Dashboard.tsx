import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User as UserIcon, Settings, LogOut, RefreshCw, Eye, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { SwipeCard } from "@/components/swipe/SwipeCard";
import { SwipeActions } from "@/components/swipe/SwipeActions";
import { MatchNotification } from "@/components/swipe/MatchNotification";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { AnimatePresence } from "framer-motion";
import { calculateCompatibilityScore } from "@/lib/compatibility";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [compatibilityScores, setCompatibilityScores] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  useNotifications(); // Enable browser notifications

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Check if user is admin (use secure RPC, does not rely on table RLS)
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_admin");

      if (adminCheckError) {
        console.error("Error checking admin status:", adminCheckError);
      }

      if (isAdmin === true) {
        // Redirect admins to admin dashboard
        navigate("/admin");
        return;
      }

      setUser(session.user);

      // Check if profile is complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile?.bio || !profile?.gender || !profile?.looking_for) {
        navigate("/onboarding");
        return;
      }

      fetchProfiles(session.user.id);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfiles = async (userId: string) => {
    setIsLoading(true);
    
    try {
      // Get current user's profile with interests
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select(`
          *,
          user_interests(interest:interests(*))
        `)
        .eq("id", userId)
        .single();

      if (currentUserProfile) {
        const userInterests = (currentUserProfile as any).user_interests?.map((ui: any) => ui.interest.name) || [];
        setUserProfile({
          ...currentUserProfile,
          interests: userInterests,
        });
      }

      const userDatingMode = (currentUserProfile as any)?.dating_mode || "online";

      // Get users already swiped on
      const { data: swipedMatches } = await supabase
        .from("matches")
        .select("liked_user_id")
        .eq("user_id", userId);

      const swipedIds = swipedMatches?.map(m => m.liked_user_id) || [];

      // Get potential matches with same dating mode
      const profileQuery: any = supabase
        .from("profiles")
        .select(`
          *,
          photos(photo_url, display_order),
          user_interests(interest:interests(*))
        `)
        .neq("id", userId)
        .not("id", "in", `(${swipedIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(20);
      
      profileQuery.eq("dating_mode", userDatingMode);
      const { data: potentialMatches } = await profileQuery;

      if (potentialMatches && currentUserProfile) {
        // Sort photos by display_order and calculate compatibility
        const userInterests = (currentUserProfile as any).user_interests?.map((ui: any) => ui.interest.name) || [];
        const scores: Record<string, number> = {};
        const sortedProfiles = potentialMatches.map((profile) => {
          const otherInterests = profile.user_interests?.map((ui: any) => ui.interest.name) || [];
          const score = calculateCompatibilityScore(
            { 
              ...currentUserProfile,
              interests: userInterests,
            },
            { 
              ...profile,
              interests: otherInterests,
            }
          );
          scores[profile.id] = score;
          
          return {
            ...profile,
            photos: (profile.photos || []).sort((a: any, b: any) => a.display_order - b.display_order),
          };
        });
        
        setCompatibilityScores(scores);
        setProfiles(sortedProfiles);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: "left" | "right" | "super") => {
    if (!user || currentIndex >= profiles.length) return;

    const likedProfile = profiles[currentIndex];
    const isLike = direction === "right" || direction === "super";

    try {
      // Record the swipe
      const { error } = await supabase.from("matches").insert({
        user_id: user.id,
        liked_user_id: likedProfile.id,
        is_match: false,
      });

      if (error) throw error;

      // Check if it's a mutual match
      if (isLike) {
        const { data: reverseMatch } = await supabase
          .from("matches")
          .select("*")
          .eq("user_id", likedProfile.id)
          .eq("liked_user_id", user.id)
          .maybeSingle();

        if (reverseMatch) {
          // It's a match! Update both records
          await supabase
            .from("matches")
            .update({ is_match: true })
            .eq("user_id", user.id)
            .eq("liked_user_id", likedProfile.id);

          await supabase
            .from("matches")
            .update({ is_match: true })
            .eq("user_id", likedProfile.id)
            .eq("liked_user_id", user.id);

          // Create notifications for both users
          await (supabase as any).from("notifications").insert([
            {
              user_id: user.id,
              type: "match",
              title: "It's a Match!",
              message: `You and ${likedProfile.display_name} liked each other!`,
              data: { match_id: likedProfile.id },
            },
            {
              user_id: likedProfile.id,
              type: "match",
              title: "It's a Match!",
              message: `You and ${user.email?.split("@")[0]} liked each other!`,
              data: { match_id: user.id },
            },
          ]);

          // Show match notification
          setMatchedProfile(likedProfile);
        }
      }

      // Move to next profile
      setCurrentIndex(currentIndex + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-fade-in">
            <Heart className="h-8 w-8 text-primary fill-primary animate-heartbeat" />
            <span className="text-2xl font-bold gradient-text">
              Spaark
            </span>
          </div>
          <div className="flex gap-2">
            <NotificationBell userId={user.id} />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile-views")} title="Profile Views" className="hover:scale-110 transition-transform">
              <Eye className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/matches")} className="hover:scale-110 transition-transform">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/messages")} className="hover:scale-110 transition-transform">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="hover:scale-110 transition-transform">
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/faq")} title="FAQ" className="hover:scale-110 transition-transform">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="hover:scale-110 transition-transform">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:scale-110 transition-transform">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8 max-w-7xl mx-auto">
          {/* Main Swipe Area */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {isLoading ? (
                <div className="text-center space-y-4 animate-fade-in">
                  <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
                  <p className="text-muted-foreground">Finding matches for you...</p>
                </div>
              ) : hasMoreProfiles ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Swipe Card Stack */}
                  <div className="relative h-[600px]">
                    <AnimatePresence>
                      {profiles.slice(currentIndex, currentIndex + 2).map((profile, index) => (
                        <SwipeCard
                          key={profile.id}
                          profile={profile}
                          onSwipe={index === 0 ? handleSwipe : () => {}}
                          compatibilityScore={compatibilityScores[profile.id]}
                          style={{
                            zIndex: 2 - index,
                            scale: 1 - index * 0.05,
                            opacity: 1 - index * 0.3,
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Swipe Actions */}
                  <SwipeActions
                    onDislike={() => handleSwipe("left")}
                    onLike={() => handleSwipe("right")}
                    onSuperLike={() => handleSwipe("super")}
                    disabled={!hasMoreProfiles}
                  />
                </div>
              ) : (
                <div className="text-center space-y-4 animate-scale-in">
                  <Heart className="h-24 w-24 text-muted-foreground mx-auto animate-pulse" />
                  <h3 className="text-2xl font-bold gradient-text">No more profiles</h3>
                  <p className="text-muted-foreground">
                    Check back later for new matches!
                  </p>
                  <Button
                    onClick={() => {
                      if (user) {
                        setCurrentIndex(0);
                        fetchProfiles(user.id);
                      }
                    }}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 animate-slide-in">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>

      {/* Match Notification */}
      <AnimatePresence>
        {matchedProfile && (
          <MatchNotification
            matchedProfile={matchedProfile}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
