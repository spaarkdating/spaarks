import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/navigation/PullToRefreshIndicator";
import { AppHeader } from "@/components/navigation/AppHeader";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { useWebRTC, CallType } from "@/hooks/useWebRTC";
import { CallUI } from "@/components/calls/CallUI";
import { IncomingCallModal } from "@/components/calls/IncomingCallModal";
import { AnimatePresence } from "framer-motion";

const Messages = () => {
  const { isLoading: isVerifying, isVerified, user } = useVerificationGuard(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // WebRTC calling hook
  const webrtc = useWebRTC({
    currentUserId: user?.id || '',
    onCallEnded: () => {
      // Optionally refresh matches or do something after call ends
    },
  });

  const handleStartCall = (type: CallType) => {
    if (selectedMatch) {
      webrtc.startCall(selectedMatch.liked_user_id, type);
    }
  };

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
    if (!isVerifying && isVerified && user) {
      fetchMatches(user.id);
    }
  }, [isVerifying, isVerified, user]);

  // Real-time updates for new matches and messages
  useEffect(() => {
    if (!user) return;

    // Channel for matches
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

    // Separate channel for messages - listen for messages where user is sender or receiver
    const messagesReceiverChannel = supabase
      .channel('messages-receiver-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          console.log('New message received - updating conversation list');
          fetchMatches(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchMatches(user.id);
        }
      )
      .subscribe();

    const messagesSenderChannel = supabase
      .channel('messages-sender-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          console.log('Message sent - updating conversation list');
          fetchMatches(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesReceiverChannel);
      supabase.removeChannel(messagesSenderChannel);
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
          // Fetch recent messages and find the first non-deleted one
          const { data: recentMessages } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read, deleted_at, deleted_by, deleted_for_everyone")
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${match.liked_user_id}),and(sender_id.eq.${match.liked_user_id},receiver_id.eq.${userId})`)
            .order("created_at", { ascending: false })
            .limit(10);

          const lastMessage = (recentMessages || []).find(msg => {
            // Skip messages deleted by current user (not deleted_for_everyone)
            if (msg.deleted_at && msg.deleted_by === userId && !msg.deleted_for_everyone) return false;
            // Skip messages deleted for everyone
            if (msg.deleted_for_everyone) return false;
            return true;
          }) || null;

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

  // Don't render until verification check is complete
  if (isVerifying || !isVerified || !user) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        shouldTrigger={shouldTrigger}
      />
      <AppHeader userId={user.id} onLogout={handleLogout} title="Messages" />

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
              onStartCall={handleStartCall}
            />
          </div>
        </div>
      </div>

      {/* Call UI */}
      <AnimatePresence>
        {(webrtc.callStatus === 'calling' || webrtc.callStatus === 'active') && (
          <CallUI
            callStatus={webrtc.callStatus}
            callType={webrtc.callType}
            formattedDuration={webrtc.formattedDuration}
            isMuted={webrtc.isMuted}
            isVideoOff={webrtc.isVideoOff}
            profile={selectedMatch?.profile}
            onEndCall={() => webrtc.endCall()}
            onToggleMute={webrtc.toggleMute}
            onToggleVideo={webrtc.toggleVideo}
            setLocalVideoElement={webrtc.setLocalVideoElement}
            setRemoteVideoElement={webrtc.setRemoteVideoElement}
          />
        )}
      </AnimatePresence>

      {/* Incoming call modal */}
      <AnimatePresence>
        {webrtc.incomingCall && (
          <IncomingCallModal
            callerProfile={webrtc.callerProfile}
            callType={webrtc.incomingCall.call_type}
            onAnswer={webrtc.answerCall}
            onDecline={webrtc.declineCall}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
