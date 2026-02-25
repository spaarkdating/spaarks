import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Crown, Lock, MapPin, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";
import { AppHeader } from "@/components/navigation/AppHeader";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { useSubscription } from "@/hooks/useSubscription";

const WhoLikedYou = () => {
  const { isLoading: isVerifying, isVerified, user } = useVerificationGuard(true);
  const { limits, canViewWhoLikedYou, loading: subscriptionLoading } = useSubscription();
  const [likes, setLikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { canView, limit } = canViewWhoLikedYou();

  const handleRefresh = async () => {
    if (user) {
      await fetchLikes(user.id);
      toast({
        title: "Refreshed!",
        description: "Updated who liked you.",
      });
    }
  };

  const { containerRef, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    if (!isVerifying && isVerified && user && !subscriptionLoading) {
      fetchLikes(user.id);
    }
  }, [isVerifying, isVerified, user, subscriptionLoading]);

  const fetchLikes = async (userId: string) => {
    setIsLoading(true);
    try {
      // Get all users who liked the current user (but user hasn't swiped on them yet)
      const { data: receivedLikes, error: receivedLikesError } = await supabase
        .from("matches")
        .select("user_id, id, created_at, action")
        .eq("liked_user_id", userId)
        .in("action", ["like", "super"])
        .order("created_at", { ascending: false });

      if (receivedLikesError) throw receivedLikesError;

      // Get users the current user has already swiped on
      const { data: userSwipes } = await supabase
        .from("matches")
        .select("liked_user_id")
        .eq("user_id", userId);

      const swipedUserIds = new Set((userSwipes || []).map(s => s.liked_user_id));

      // Filter to only show likes from users the current user hasn't swiped on
      const pendingLikes = (receivedLikes || []).filter(
        like => !swipedUserIds.has(like.user_id)
      );

      setTotalLikes(pendingLikes.length);

      // If user can't view or has a limit, slice the results
      const likesToShow = canView
        ? limit === null
          ? pendingLikes
          : pendingLikes.slice(0, limit)
        : [];

      if (likesToShow.length === 0) {
        setLikes([]);
        setIsLoading(false);
        return;
      }

      // Fetch profile data for users who liked
      const userIds = likesToShow.map(l => l.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          bio,
          location,
          date_of_birth,
          photos(photo_url, display_order)
        `)
        .in("id", userIds);

      if (profileError) throw profileError;

      const likesWithProfiles = likesToShow.map((like: any) => {
        const profile = (profileData || []).find((p: any) => p.id === like.user_id);
        return {
          id: like.id,
          created_at: like.created_at,
          action: like.action,
          user_id: like.user_id,
          profile: profile,
        };
      });

      setLikes(likesWithProfiles);
    } catch (error: any) {
      console.error("Error loading likes:", error);
      toast({
        title: "Error loading likes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Don't render until verification check is complete
  if (isVerifying || !isVerified || !user || subscriptionLoading) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <AppHeader userId={user.id} onLogout={handleLogout} title="Who Liked You" />
      <div className="h-14 safe-area-pt" />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
        {!canView ? (
          // Upgrade prompt for free users
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <Heart className="h-24 w-24 text-primary/30 mx-auto" />
              <Lock className="h-10 w-10 text-primary absolute bottom-0 right-0" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {totalLikes > 0 ? `${totalLikes} people liked you!` : "See who likes you"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upgrade your plan to see who's interested in you and match with them instantly.
            </p>
            <Button
              onClick={() => navigate("/pricing")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to See Likes
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading who liked you...</p>
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No pending likes yet</h2>
            <p className="text-muted-foreground mb-6">
              Keep swiping! Someone special will like you soon.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Start Swiping
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-primary" />
                Who Liked You
              </h2>
              <p className="text-muted-foreground">
                {totalLikes} {totalLikes === 1 ? "person has" : "people have"} liked you
                {limit !== null && totalLikes > limit && (
                  <span className="text-primary ml-1">
                    (showing {limit} of {totalLikes})
                  </span>
                )}
              </p>
              {limit !== null && totalLikes > limit && (
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto mt-1"
                  onClick={() => navigate("/pricing")}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade to see all
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {likes.map((like) => {
                const profile = like.profile;
                if (!profile) return null;
                
                const photo = profile?.photos?.[0]?.photo_url || "/placeholder.svg";
                const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;

                return (
                  <Card 
                    key={like.id} 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in cursor-pointer"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden group">
                      <img
                        src={photo}
                        alt={profile.display_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Super like badge */}
                      {like.action === "super" && (
                        <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-white" />
                          <span className="text-xs text-white font-semibold">Super Like</span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <p className="text-xs text-primary-foreground font-semibold">
                          {formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Heart icon overlay */}
                      <div className="absolute bottom-3 right-3 bg-destructive/90 backdrop-blur-sm p-2 rounded-full">
                        <Heart className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold">
                          {profile.display_name}
                          {age && <span className="text-muted-foreground">, {age}</span>}
                        </h3>
                        {profile.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {profile.location}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {profile.bio || "No bio yet"}
                      </p>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/dashboard");
                        }}
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg hover:shadow-primary/50 transition-all"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        View & Match
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhoLikedYou;
