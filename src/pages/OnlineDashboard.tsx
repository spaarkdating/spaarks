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
import { MobileNav } from "@/components/navigation/MobileNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PhotoCarousel } from "@/components/profile/PhotoCarousel";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Briefcase, GraduationCap, Heart as HeartIcon } from "lucide-react";

interface OnlineDashboardProps {
  user: User;
  onLogout: () => void;
}

export const OnlineDashboard = ({ user, onLogout }: OnlineDashboardProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);
  const [compatibilityScores, setCompatibilityScores] = useState<Record<string, number>>({});
  const [lastSwipe, setLastSwipe] = useState<{ matchId: string; profileIndex: number } | null>(null);
  const [canRewind, setCanRewind] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profilePhotos, setProfilePhotos] = useState<any[]>([]);
  const [profileInterests, setProfileInterests] = useState<any[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  useNotifications();

  const handleRefresh = async () => {
    await fetchProfiles(user.id);
    toast({
      title: "Refreshed!",
      description: "Found new profiles for you.",
    });
  };

  const { containerRef, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    if (user) {
      fetchProfiles(user.id);
    }
  }, [user]);

  const fetchProfiles = async (userId: string) => {
    setIsLoading(true);
    
    try {
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select(`
          *,
          user_interests(interest:interests(*))
        `)
        .eq("id", userId)
        .single();

      const { data: swipedMatches } = await supabase
        .from("matches")
        .select("liked_user_id")
        .eq("user_id", userId);

      const swipedIds = swipedMatches?.map(m => m.liked_user_id) || [];

      const { data: potentialMatches } = await supabase
        .from("profiles")
        .select(`
          *,
          photos(photo_url, display_order),
          user_interests(interest:interests(*))
        `)
        .neq("id", userId)
        .eq("dating_mode", "online")
        .not("id", "in", `(${swipedIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (potentialMatches && currentUserProfile) {
        const userInterests = (currentUserProfile as any).user_interests?.map((ui: any) => ui.interest.name) || [];
        const scores: Record<string, number> = {};
        const sortedProfiles = potentialMatches.map((profile) => {
          const otherInterests = profile.user_interests?.map((ui: any) => ui.interest.name) || [];
          const score = calculateCompatibilityScore(
            { ...currentUserProfile, interests: userInterests },
            { ...profile, interests: otherInterests }
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

  const handleProfileClick = async (profile: any) => {
    setIsProfileLoading(true);
    setSelectedProfile(profile);
    
    try {
      const { data: photos } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", profile.id)
        .order("display_order", { ascending: true });

      const { data: userInterests } = await supabase
        .from("user_interests")
        .select("interest:interests(*)")
        .eq("user_id", profile.id);

      setProfilePhotos(photos || []);
      setProfileInterests(userInterests?.map((ui: any) => ui.interest) || []);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleRewind = async () => {
    if (!lastSwipe || !user) return;

    try {
      const { error } = await supabase
        .from("matches")
        .delete()
        .eq("user_id", user.id)
        .eq("liked_user_id", profiles[lastSwipe.profileIndex]?.id);

      if (error) throw error;

      setCurrentIndex(lastSwipe.profileIndex);
      setLastSwipe(null);
      setCanRewind(false);

      toast({
        title: "Swipe undone!",
        description: "You can now swipe on this profile again.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to undo swipe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSwipe = async (direction: "left" | "right" | "super") => {
    if (!user || currentIndex >= profiles.length) return;

    const likedProfile = profiles[currentIndex];
    const isLike = direction === "right" || direction === "super";
    const currentProfileIndex = currentIndex;

    setLastSwipe(null);
    setCanRewind(false);

    try {
      const { error } = await supabase.from("matches").insert({
        user_id: user.id,
        liked_user_id: likedProfile.id,
        is_match: false,
      });

      if (error) throw error;

      setLastSwipe({ matchId: likedProfile.id, profileIndex: currentProfileIndex });
      setCanRewind(true);

      if (isLike) {
        const { data: reverseMatch } = await supabase
          .from("matches")
          .select("*")
          .eq("user_id", likedProfile.id)
          .eq("liked_user_id", user.id)
          .maybeSingle();

        if (reverseMatch) {
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

          setMatchedProfile(likedProfile);
        }
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-fade-in">
            <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary animate-heartbeat" />
            <span className="text-xl md:text-2xl font-bold gradient-text">
              Spaark <span className="text-sm font-normal text-muted-foreground">Online</span>
            </span>
          </div>
          
          <div className="hidden md:flex gap-2">
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
            <Button variant="ghost" size="icon" onClick={onLogout} className="hover:scale-110 transition-transform">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <MobileNav
            isAuthenticated
            onLogout={onLogout}
            links={[
              { to: "/profile-views", label: "Profile Views", icon: <Eye className="h-5 w-5" />, onClick: () => navigate("/profile-views") },
              { to: "/matches", label: "Matches", icon: <Heart className="h-5 w-5" />, onClick: () => navigate("/matches") },
              { to: "/messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" />, onClick: () => navigate("/messages") },
              { to: "/profile", label: "Profile", icon: <UserIcon className="h-5 w-5" />, onClick: () => navigate("/profile") },
              { to: "/faq", label: "FAQ", icon: <HelpCircle className="h-5 w-5" />, onClick: () => navigate("/faq") },
              { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, onClick: () => navigate("/settings") },
            ]}
          />
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-4 sm:gap-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {isLoading ? (
                <div className="text-center space-y-4 animate-fade-in">
                  <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
                  <p className="text-muted-foreground">Finding matches for you...</p>
                </div>
              ) : hasMoreProfiles ? (
                <div className="space-y-4 sm:space-y-6 animate-fade-in">
                  <div className="relative h-[500px] sm:h-[600px]">
                    <AnimatePresence>
                      {profiles.slice(currentIndex, currentIndex + 2).map((profile, index) => (
                        <SwipeCard
                          key={profile.id}
                          profile={profile}
                          onSwipe={index === 0 ? handleSwipe : () => {}}
                          compatibilityScore={compatibilityScores[profile.id]}
                          onProfileClick={index === 0 ? () => handleProfileClick(profile) : undefined}
                          style={{
                            zIndex: 2 - index,
                            scale: 1 - index * 0.05,
                            opacity: 1 - index * 0.3,
                          }}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  <SwipeActions
                    onDislike={() => handleSwipe("left")}
                    onLike={() => handleSwipe("right")}
                    onSuperLike={() => handleSwipe("super")}
                    onRewind={handleRewind}
                    disabled={!hasMoreProfiles}
                    canRewind={canRewind}
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
                      setCurrentIndex(0);
                      fetchProfiles(user.id);
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

          <div className="hidden lg:block">
            <div className="sticky top-24 animate-slide-in">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {matchedProfile && (
          <MatchNotification
            matchedProfile={matchedProfile}
            onClose={() => setMatchedProfile(null)}
          />
        )}
      </AnimatePresence>

      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          {isProfileLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedProfile ? (
            <div className="grid md:grid-cols-2 h-full max-h-[95vh]">
              {/* Photo Carousel - Left Side */}
              <div className="relative h-[50vh] md:h-[95vh] bg-muted">
                {profilePhotos.length > 0 ? (
                  <PhotoCarousel photos={profilePhotos} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">No photos available</p>
                  </div>
                )}
              </div>

              {/* Profile Details - Right Side */}
              <div className="overflow-y-auto p-6 space-y-4 max-h-[45vh] md:max-h-[95vh]">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedProfile.display_name}
                      {selectedProfile.date_of_birth && (
                        <span className="text-muted-foreground font-normal">
                          , {new Date().getFullYear() - new Date(selectedProfile.date_of_birth).getFullYear()}
                        </span>
                      )}
                    </h2>
                    {selectedProfile.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        {selectedProfile.location}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProfile(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {selectedProfile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{selectedProfile.bio}</p>
                  </div>
                )}

                {(selectedProfile.occupation || selectedProfile.education) && (
                  <div className="space-y-2">
                    {selectedProfile.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedProfile.occupation}</span>
                      </div>
                    )}
                    {selectedProfile.education && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedProfile.education}</span>
                      </div>
                    )}
                  </div>
                )}

                {profileInterests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {profileInterests.map((interest: any) => (
                        <Badge key={interest.id} variant="secondary">
                          {interest.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedProfile.height || selectedProfile.relationship_goal || 
                  selectedProfile.smoking || selectedProfile.drinking || selectedProfile.religion) && (
                  <div>
                    <h3 className="font-semibold mb-2">More Details</h3>
                    <div className="space-y-2 text-sm">
                      {selectedProfile.height && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Height</span>
                          <span>{selectedProfile.height}</span>
                        </div>
                      )}
                      {selectedProfile.relationship_goal && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Looking for</span>
                          <span>{selectedProfile.relationship_goal}</span>
                        </div>
                      )}
                      {selectedProfile.smoking && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Smoking</span>
                          <span>{selectedProfile.smoking}</span>
                        </div>
                      )}
                      {selectedProfile.drinking && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Drinking</span>
                          <span>{selectedProfile.drinking}</span>
                        </div>
                      )}
                      {selectedProfile.religion && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Religion</span>
                          <span>{selectedProfile.religion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
