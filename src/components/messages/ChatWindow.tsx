import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";

interface ChatWindowProps {
  match: any;
  currentUserId: string;
  onMessagesUpdate: () => void;
}

export const ChatWindow = ({ match, currentUserId, onMessagesUpdate }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();
  const { showNotification } = useNotifications();

  useEffect(() => {
    if (!match) return;

    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [match]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!match) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${match.liked_user_id}),and(sender_id.eq.${match.liked_user_id},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      markMessagesAsRead();
    }
  };

  const markMessagesAsRead = async () => {
    if (!match) return;

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", match.liked_user_id)
      .eq("receiver_id", currentUserId)
      .eq("read", false);

    onMessagesUpdate();
  };

  const setupRealtimeSubscription = () => {
    if (!match) return;

    const channel = supabase
      .channel(`messages:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
          markMessagesAsRead();
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const otherUsers = Object.values(state).filter(
          (presence: any) => presence[0]?.user_id !== currentUserId
        );
        setIsTyping(otherUsers.some((user: any) => user[0]?.typing));
      })
      .subscribe();

    channelRef.current = channel;
  };

  const handleTyping = () => {
    if (channelRef.current) {
      channelRef.current.track({ user_id: currentUserId, typing: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({ user_id: currentUserId, typing: false });
        }
      }, 1000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !match || isSending) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: match.liked_user_id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      // Create notification for receiver
      await (supabase as any).from("notifications").insert({
        user_id: match.liked_user_id,
        type: "message",
        title: "New Message",
        message: `You have a new message from ${match.profile.display_name}`,
        data: { match_id: match.id, sender_id: currentUserId },
      });

      setNewMessage("");
      if (channelRef.current) {
        channelRef.current.track({ user_id: currentUserId, typing: false });
      }
      onMessagesUpdate();
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!match) {
    return (
      <div className="bg-card rounded-2xl border border-border flex items-center justify-center h-full">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Choose a match to start messaging
          </p>
        </div>
      </div>
    );
  }

  const profile = match.profile;
  const photo = profile?.photos?.[0]?.photo_url || "/placeholder.svg";

  return (
    <div className="bg-card rounded-2xl border border-border flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <img
          src={photo}
          alt={profile.display_name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h2 className="font-semibold">{profile.display_name}</h2>
          {isTyping && (
            <p className="text-sm text-muted-foreground animate-pulse">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSender = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isSender
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                  {isSender && message.read && (
                    <span className="text-xs opacity-70">• Read</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
