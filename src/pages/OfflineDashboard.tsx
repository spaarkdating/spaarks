import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, User as UserIcon, Settings, LogOut, RefreshCw, Eye, HelpCircle, MapPin, Calendar } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileNav } from "@/components/navigation/MobileNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateCompatibilityScore } from "@/lib/compatibility";
import { CompatibilityBadge } from "@/components/swipe/CompatibilityBadge";

interface OfflineDashboardProps {
  user: User;
  onLogout: () => void;
}

export const OfflineDashboard = ({ user, onLogout }: OfflineDashboardProps) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [compatibilityScores, setCompatibilityScores] = useState<Record<string, number>>({});
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
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
      setLikedProfiles(new Set(swipedIds));

      const { data: potentialMatches } = await supabase
        .from("profiles")
        .select(`
          *,
          photos(photo_url, display_order),
          user_interests(interest:interests(*))
        `)
        .neq("id", userId)
        .eq("dating_mode", "offline")
        .order("created_at", { ascending: false })
        .limit(50);

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
            interests: otherInterests,
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

  const handleLike = async (profileId: string) => {
    try {
      const { error } = await supabase.from("matches").insert({
        user_id: user.id,
        liked_user_id: profileId,
        is_match: false,
      });

      if (error) throw error;

      setLikedProfiles(new Set([...likedProfiles, profileId]));

      // Check for mutual match
      const { data: reverseMatch } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", profileId)
        .eq("liked_user_id", user.id)
        .maybeSingle();

      if (reverseMatch) {
        await supabase
          .from("matches")
          .update({ is_match: true })
          .eq("user_id", user.id)
          .eq("liked_user_id", profileId);

        await supabase
          .from("matches")
          .update({ is_match: true })
          .eq("user_id", profileId)
          .eq("liked_user_id", user.id);

        const profile = profiles.find(p => p.id === profileId);
        await (supabase as any).from("notifications").insert([
          {
            user_id: user.id,
            type: "match",
            title: "It's a Match!",
            message: `You and ${profile?.display_name} liked each other!`,
            data: { match_id: profileId },
          },
          {
            user_id: profileId,
            type: "match",
            title: "It's a Match!",
            message: `You and ${user.email?.split("@")[0]} liked each other!`,
            data: { match_id: user.id },
          },
        ]);

        toast({
          title: "It's a Match! 🎉",
          description: `You and ${profile?.display_name} liked each other!`,
        });
      } else {
        toast({
          title: "Liked!",
          description: "Profile has been added to your likes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const nearbyProfiles = profiles.filter(p => !likedProfiles.has(p.id));
  const myLikes = profiles.filter(p => likedProfiles.has(p.id));

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-fade-in group cursor-pointer">
            <img 
              src={logo} 
              alt="Spaark Logo" 
              className="h-6 w-6 md:h-7 md:w-7 object-contain drop-shadow-md"
            />
            <span className="text-xl md:text-2xl font-bold gradient-text">
              Spaark <span className="text-sm font-normal text-muted-foreground">Offline</span>
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
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="likes">My Likes ({myLikes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover">
            {isLoading ? (
              <div className="text-center space-y-4 animate-fade-in">
                <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Finding nearby singles...</p>
              </div>
            ) : nearbyProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyProfiles.map((profile) => (
                  <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div 
                      className="relative h-64 overflow-hidden"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      <img
                        src={profile.photos[0]?.photo_url || "/placeholder.svg"}
                        alt={profile.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <CompatibilityBadge score={compatibilityScores[profile.id] || 0} />
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {profile.display_name}
                            {profile.date_of_birth && (
                              <span className="text-muted-foreground font-normal">, {calculateAge(profile.date_of_birth)}</span>
                            )}
                          </h3>
                          {profile.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {profile.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                      )}
                      
                      {profile.interests && profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.interests.slice(0, 3).map((interest: string) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {profile.interests.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{profile.interests.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => handleLike(profile.id)}
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Like
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-4 animate-scale-in">
                <Heart className="h-24 w-24 text-muted-foreground mx-auto animate-pulse" />
                <h3 className="text-2xl font-bold gradient-text">No more profiles</h3>
                <p className="text-muted-foreground">
                  Check back later for new matches!
                </p>
                <Button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes">
            {myLikes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myLikes.map((profile) => (
                  <Card key={profile.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                    <div 
                      className="relative h-64 overflow-hidden"
                      onClick={() => navigate(`/profile/${profile.id}`)}
                    >
                      <img
                        src={profile.photos[0]?.photo_url || "/placeholder.svg"}
                        alt={profile.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <CompatibilityBadge score={compatibilityScores[profile.id] || 0} />
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {profile.display_name}
                            {profile.date_of_birth && (
                              <span className="text-muted-foreground font-normal">, {calculateAge(profile.date_of_birth)}</span>
                            )}
                          </h3>
                          {profile.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              {profile.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
                      )}
                      
                      <Badge variant="outline" className="w-full justify-center">
                        <Heart className="h-3 w-3 mr-1 fill-current" />
                        Liked
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-4 py-12">
                <Heart className="h-24 w-24 text-muted-foreground mx-auto" />
                <h3 className="text-xl font-semibold">No likes yet</h3>
                <p className="text-muted-foreground">
                  Start exploring profiles in the Discover tab!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
