import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";

const Messages = () => {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      // Get all mutual matches
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
            photos(photo_url, display_order)
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
      }
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Messages
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 h-[calc(100vh-80px)]">
        <div className="grid md:grid-cols-[350px,1fr] gap-4 h-full">
          <ConversationList
            matches={matches}
            selectedMatch={selectedMatch}
            onSelectMatch={(match) => {
              setSelectedMatch(match);
              setSearchParams({ match: match.id });
            }}
            currentUserId={user.id}
          />
          <ChatWindow
            match={selectedMatch}
            currentUserId={user.id}
            onMessagesUpdate={() => fetchMatches(user.id)}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
