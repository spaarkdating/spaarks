import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Settings, LogOut, MessageCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MobileNav } from "@/components/navigation/MobileNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";

const Matches = () => {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: matchesData } = await supabase
        .from("matches")
        .select(`
          id,
          created_at,
          liked_user_id,
          profile:profiles!matches_liked_user_id_fkey(
            id,
            display_name,
            bio,
            location,
            date_of_birth,
            photos(photo_url, display_order),
            user_interests(interest:interests(name))
          )
        `)
        .eq("user_id", userId)
        .eq("is_match", true)
        .order("created_at", { ascending: false });

      if (matchesData) {
        // Get last message for each match
        const matchesWithMessages = await Promise.all(
          matchesData.map(async (match) => {
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
      }
    } catch (error: any) {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 md:h-10 md:w-10">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary" />
              <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Matches
              </span>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          <MobileNav
            isAuthenticated
            onLogout={handleLogout}
            links={[
              { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, onClick: () => navigate("/settings") },
            ]}
          />
        </div>
      </header>

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
                    <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden group">
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
    </div>
  );
};

export default Matches;
