import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { MobileNav } from "@/components/navigation/MobileNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (user) {
      await fetchMatches(user.id);
      toast({
        title: "Refreshed!",
        description: "Messages updated.",
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

  useEffect(() => {
    const matchId = searchParams.get("match");
    if (matchId && matches.length > 0) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setSelectedMatch(match);
      }
    }
  }, [searchParams, matches]);

  const fetchMatches = async (userId: string) => {
    try {
      // Get matches where current user initiated the like
      const { data: matchesAsInitiator } = await supabase
        .from("matches")
        .select(`
          id,
          created_at,
          user_id,
          liked_user_id,
          profile:profiles!matches_liked_user_id_fkey(
            id,
            display_name,
            bio,
            photos(photo_url, display_order)
          )
        `)
        .eq("user_id", userId)
        .eq("is_match", true);

      // Get matches where current user was liked
      const { data: matchesAsReceiver } = await supabase
        .from("matches")
        .select(`
          id,
          created_at,
          user_id,
          liked_user_id,
          otherProfile:profiles!matches_user_id_fkey(
            id,
            display_name,
            bio,
            photos(photo_url, display_order)
          )
        `)
        .eq("liked_user_id", userId)
        .eq("is_match", true);

      // Combine and normalize matches
      const allMatches = [
        ...(matchesAsInitiator || []).map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          liked_user_id: m.liked_user_id,
          profile: m.profile,
        })),
        ...(matchesAsReceiver || []).map((m: any) => ({
          id: m.id,
          created_at: m.created_at,
          liked_user_id: m.user_id,
          profile: m.otherProfile,
        })),
      ];

      // Sort by created_at
      allMatches.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Get last message for each match
      const matchesWithMessages = await Promise.all(
        allMatches.map(async (match) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read")
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
      toast({
        title: "Error loading matches",
        description: error.message,
        variant: "destructive",
      });
    }
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
                Messages
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

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] pb-24 md:pb-6">
        <div className="grid md:grid-cols-[350px,1fr] gap-2 sm:gap-4 h-full">
          {/* Hide conversation list on mobile when a chat is selected */}
          <div className={selectedMatch ? "hidden md:block" : "block"}>
            <ConversationList
              matches={matches}
              selectedMatch={selectedMatch}
              onSelectMatch={(match) => {
                setSelectedMatch(match);
                setSearchParams({ match: match.id });
              }}
              currentUserId={user.id}
            />
          </div>
          <div className={selectedMatch ? "block" : "hidden md:block"}>
            <ChatWindow
              match={selectedMatch}
              currentUserId={user.id}
              onMessagesUpdate={() => fetchMatches(user.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
