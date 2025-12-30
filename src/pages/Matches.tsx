import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, MessageCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";
import { ProfileView } from "@/components/profile/ProfileView";
import { PhotoCarousel } from "@/components/profile/PhotoCarousel";
import ReportProfileDialog from "@/components/profile/ReportProfileDialog";
import { recordProfileView } from "@/lib/profileViews";
import { AppHeader } from "@/components/navigation/AppHeader";

const Matches = () => {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profilePhotos, setProfilePhotos] = useState<any[]>([]);
  const [profileInterests, setProfileInterests] = useState<any[]>([]);
  const [showPhotoCarousel, setShowPhotoCarousel] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (user) {
      await fetchMatches(user.id);
      toast({
        title: "Refreshed!",
        description: "Matches updated.",
      });
    }
  };

  const { containerRef, pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      fetchMatches(user.id);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time updates for new matches
  useEffect(() => {
    if (!user) return;

    const matchesChannel = supabase
      .channel('matches-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `liked_user_id=eq.${user.id}`
        },
        () => {
          fetchMatches(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `liked_user_id=eq.${user.id}`
        },
        () => {
          fetchMatches(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };
  }, [user]);

  const fetchMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      // Get all likes initiated by current user (only likes, not passes)
      const { data: userLikes, error: userLikesError } = await supabase
        .from("matches")
        .select("liked_user_id, id, created_at, action")
        .eq("user_id", userId)
        .in("action", ["like", "super"]);

      if (userLikesError) throw userLikesError;

      // Get all likes received by current user (only likes, not passes)
      const { data: receivedLikes, error: receivedLikesError } = await supabase
        .from("matches")
        .select("user_id, id, created_at, action")
        .eq("liked_user_id", userId)
        .in("action", ["like", "super"]);

      if (receivedLikesError) throw receivedLikesError;

      // Find mutual matches: both users must have liked each other
      const userLikedIds = new Set((userLikes || []).map(m => m.liked_user_id));
      const mutualMatchIds = (receivedLikes || [])
        .map(m => m.user_id)
        .filter(id => userLikedIds.has(id));

      if (mutualMatchIds.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      // Get the match records for these mutual matches
      const mutualMatchRecords = (userLikes || []).filter(m => 
        mutualMatchIds.includes(m.liked_user_id)
      );

      // Fetch profile data for mutual matches
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          bio,
          location,
          date_of_birth,
          photos(photo_url, display_order),
          user_interests(interest:interests(name))
        `)
        .in("id", mutualMatchIds);

      if (profileError) throw profileError;

      const allMatches = mutualMatchRecords.map((m: any) => {
        const profile = (profileData || []).find((p: any) => p.id === m.liked_user_id);
        return {
          id: m.id,
          created_at: m.created_at,
          liked_user_id: m.liked_user_id,
          profile: profile,
        };
      });

      // Sort by created_at
      allMatches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Get last message for each match
      const matchesWithMessages = await Promise.all(
        allMatches.map(async (match) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${match.liked_user_id}),and(sender_id.eq.${match.liked_user_id},receiver_id.eq.${userId})`)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...match,
            lastMessage,
          };
        })
      );

      setMatches(matchesWithMessages);
    } catch (error: any) {
      console.error("Error loading matches:", error);
      toast({
        title: "Error loading matches",
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

  const handleProfileClick = async (profile: any) => {
    // Fetch full profile details including all fields
    const { data: fullProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setSelectedProfile(profile); // Fallback to partial data
    } else {
      setSelectedProfile(fullProfile);
    }
    
    // Fetch photos
    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", profile.id)
      .order("display_order");
    
    // Fetch interests
    const { data: interests } = await supabase
      .from("user_interests")
      .select("interest:interests(*)")
      .eq("user_id", profile.id);
    
    setProfilePhotos(photos || []);
    setProfileInterests(interests?.map((i: any) => i.interest) || []);
    
    // Record profile view when clicking to see details
    if (user && user.id !== profile.id) {
      await recordProfileView(user.id, profile.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <AppHeader userId={user.id} onLogout={handleLogout} title="Matches" />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
        {isLoading ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">
              Start swiping to find your perfect match!
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
              <h2 className="text-3xl font-bold mb-2">Your Matches</h2>
              <p className="text-muted-foreground">
                You have {matches.length} mutual {matches.length === 1 ? "match" : "matches"}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {matches.map((match) => {
                const profile = match.profile;
                const photo = profile?.photos?.[0]?.photo_url || "/placeholder.svg";
                const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
                const lastMessage = match.lastMessage;

                return (
                  <Card key={match.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
                    <div 
                      className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden group cursor-pointer"
                      onClick={() => handleProfileClick(profile)}
                    >
                      <img
                        src={photo}
                        alt={profile.display_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <p className="text-xs text-primary-foreground font-semibold">
                          {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
                        </p>
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
                        {profile.bio}
                      </p>

                      {profile.user_interests && profile.user_interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {profile.user_interests.slice(0, 3).map((ui: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {ui.interest.name}
                            </Badge>
                          ))}
                          {profile.user_interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.user_interests.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {lastMessage && (
                        <div className="bg-muted rounded-lg p-2 mb-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {lastMessage.sender_id === user.id ? "You: " : `${profile.display_name}: `}
                          </p>
                          <p className="text-sm line-clamp-1">{lastMessage.content}</p>
                        </div>
                      )}

                      <Button
                        onClick={() => navigate(`/messages?match=${match.id}`)}
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg hover:shadow-primary/50 transition-all"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {lastMessage ? "Continue Chat" : "Send Message"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              {/* Photos - clickable to open carousel */}
              <div className="grid grid-cols-3 gap-2">
                {profilePhotos.slice(0, 6).map((photo, index) => (
                  <div 
                    key={photo.id} 
                    className="relative aspect-square cursor-pointer group"
                    onClick={() => {
                      setCarouselStartIndex(index);
                      setShowPhotoCarousel(true);
                    }}
                  >
                    <img
                      src={photo.photo_url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
              
              <ProfileView
                profile={selectedProfile}
                photos={profilePhotos}
                interests={profileInterests}
                showPhotos={false}
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const matchData = matches.find(m => m.profile.id === selectedProfile.id);
                    if (matchData) {
                      navigate(`/messages?match=${matchData.id}`);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <ReportProfileDialog 
                  reportedUserId={selectedProfile.id} 
                  reportedUserName={selectedProfile.display_name || "User"} 
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Carousel Dialog */}
      <Dialog open={showPhotoCarousel} onOpenChange={setShowPhotoCarousel}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 bg-background/95">
          <PhotoCarousel
            photos={profilePhotos}
            initialIndex={carouselStartIndex}
            onClose={() => setShowPhotoCarousel(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Matches;
