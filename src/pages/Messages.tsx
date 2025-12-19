import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, LogOut } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
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

  // Real-time updates for new matches and messages
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
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
      // Get all likes initiated by current user
      const { data: userLikes, error: userLikesError } = await supabase
        .from("matches")
        .select("liked_user_id, id, created_at")
        .eq("user_id", userId);

      if (userLikesError) throw userLikesError;

      // Get all likes received by current user
      const { data: receivedLikes, error: receivedLikesError } = await supabase
        .from("matches")
        .select("user_id, id, created_at")
        .eq("liked_user_id", userId);

      if (receivedLikesError) throw receivedLikesError;

      // Find mutual matches (users who appear in both lists)
      const userLikedIds = new Set((userLikes || []).map(m => m.liked_user_id));
      const mutualMatchIds = (receivedLikes || [])
        .map(m => m.user_id)
        .filter(id => userLikedIds.has(id));

      if (mutualMatchIds.length === 0) {
        setMatches([]);
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
          photos(photo_url, display_order)
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
      console.error("Error loading matches:", error);
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
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-white/90 p-1.5 rounded-lg shadow-md">
                <img 
                  src={logo} 
                  alt="Spaark Logo" 
                  className="h-6 w-6 md:h-7 md:w-7 object-contain"
                />
              </div>
              <span className="text-xl md:text-2xl font-bold text-white">
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
          <div className={selectedMatch ? "block h-full" : "hidden md:block h-full"}>
            <ChatWindow
              match={selectedMatch}
              currentUserId={user.id}
              onMessagesUpdate={() => fetchMatches(user.id)}
              onBack={() => {
                setSelectedMatch(null);
                setSearchParams({});
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
