import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User as UserIcon, Settings, LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SwipeCard } from "@/components/swipe/SwipeCard";
import { SwipeActions } from "@/components/swipe/SwipeActions";
import { MatchNotification } from "@/components/swipe/MatchNotification";
import { AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
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
      // Get users already swiped on
      const { data: swipedMatches } = await supabase
        .from("matches")
        .select("liked_user_id")
        .eq("user_id", userId);

      const swipedIds = swipedMatches?.map(m => m.liked_user_id) || [];

      // Get potential matches
      const { data: potentialMatches } = await supabase
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

      if (potentialMatches) {
        // Sort photos by display_order
        const sortedProfiles = potentialMatches.map(profile => ({
          ...profile,
          photos: (profile.photos || []).sort((a: any, b: any) => a.display_order - b.display_order)
        }));
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
          .single();

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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Spaark
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/matches")}>
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-full max-w-md">
          {isLoading ? (
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-muted-foreground">Finding matches for you...</p>
            </div>
          ) : hasMoreProfiles ? (
            <div className="space-y-6">
              {/* Swipe Card Stack */}
              <div className="relative h-[600px]">
                <AnimatePresence>
                  {profiles.slice(currentIndex, currentIndex + 2).map((profile, index) => (
                    <SwipeCard
                      key={profile.id}
                      profile={profile}
                      onSwipe={index === 0 ? handleSwipe : () => {}}
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
            <div className="text-center space-y-4">
              <Heart className="h-24 w-24 text-muted-foreground mx-auto" />
              <h3 className="text-2xl font-bold">No more profiles</h3>
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
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
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
