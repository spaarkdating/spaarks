import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Sparkles, Image, Video, Mic, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getRandomIcebreakers } from "@/data/icebreakers";
import { useNavigate } from "react-router-dom";
interface ChatWindowProps {
  match: any;
  currentUserId: string;
  onMessagesUpdate: () => void;
  onBack?: () => void;
}

export const ChatWindow = ({ match, currentUserId, onMessagesUpdate, onBack }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initialScrollDone = useRef(false);
  const { toast } = useToast();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  useEffect(() => {
    if (!match) return;

    fetchMessages();
    // Delay icebreaker generation to avoid rapid changes when switching conversations
    const icebreakerTimeout = setTimeout(() => {
      setIcebreakers(getRandomIcebreakers(3));
    }, 800);
    setupRealtimeSubscription();

    return () => {
      clearTimeout(icebreakerTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [match]);

  useEffect(() => {
    // Only auto-scroll after initial load or when new messages arrive
    if (messages.length > 0) {
      if (!initialScrollDone.current) {
        // First load - scroll instantly without animation
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        initialScrollDone.current = true;
      } else {
        // Subsequent messages - smooth scroll
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // Reset initial scroll flag when match changes
  useEffect(() => {
    initialScrollDone.current = false;
  }, [match?.id]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleMediaUpload = async (type: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file under 10MB",
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);
        
        // Send message with media URL
        const mediaPrefix = type === 'image' ? '[IMAGE]' : type === 'video' ? '[VIDEO]' : '[AUDIO]';
        const { error } = await supabase.from("messages").insert({
          sender_id: currentUserId,
          receiver_id: match.liked_user_id,
          content: `${mediaPrefix}${publicUrl}`,
        });

        if (error) throw error;

        // Create notification
        await (supabase as any).from("notifications").insert({
          user_id: match.liked_user_id,
          type: "message",
          title: "New Message",
          message: `You received a ${type} from ${match.profile.display_name}`,
          data: { match_id: match.id, sender_id: currentUserId },
        });

        onMessagesUpdate();
        toast({
          title: "Sent!",
          description: `Your ${type} has been sent.`,
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to send media. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
        setShowMediaOptions(false);
      }
    };
    
    input.click();
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
    <div className="bg-card rounded-2xl border border-border flex flex-col h-full relative overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
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
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isSender = message.sender_id === currentUserId;
          const content = message.content;
          
          // Check for media messages
          const isImage = content.startsWith('[IMAGE]');
          const isVideo = content.startsWith('[VIDEO]');
          const isAudio = content.startsWith('[AUDIO]');
          const mediaUrl = isImage ? content.slice(7) : isVideo ? content.slice(7) : isAudio ? content.slice(7) : null;
          
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
                {isImage && mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt="Shared image" 
                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(mediaUrl, '_blank')}
                  />
                ) : isVideo && mediaUrl ? (
                  <video 
                    src={mediaUrl} 
                    controls 
                    className="max-w-full rounded-lg"
                  />
                ) : isAudio && mediaUrl ? (
                  <audio 
                    src={mediaUrl} 
                    controls 
                    className="max-w-full"
                  />
                ) : (
                  <p className="text-sm">{content}</p>
                )}
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
      <div className="p-4 border-t border-border space-y-3">
        {messages.length === 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Icebreakers</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIcebreakers(getRandomIcebreakers(3))}
                className="h-7 text-xs hover:bg-primary/10"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {icebreakers.map((icebreaker, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start text-left h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/50 transition-all animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  onClick={() => {
                    setNewMessage(icebreaker);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-2 flex-shrink-0 text-primary" />
                  <span className="text-sm">{icebreaker}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage}>
          <div className="flex gap-2 items-center">
            {/* Media options toggle */}
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 transition-all ${showMediaOptions ? 'bg-primary/10 text-primary' : ''}`}
                onClick={() => setShowMediaOptions(!showMediaOptions)}
                disabled={isSending}
              >
                {showMediaOptions ? <X className="h-5 w-5" /> : <Image className="h-5 w-5" />}
              </Button>
              
              {/* Media options dropdown */}
              {showMediaOptions && (
                <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 flex flex-col gap-1 animate-fade-in z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => handleMediaUpload('image')}
                    disabled={isSending}
                  >
                    <Image className="h-4 w-4 text-primary" />
                    <span>Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => handleMediaUpload('video')}
                    disabled={isSending}
                  >
                    <Video className="h-4 w-4 text-primary" />
                    <span>Video</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => handleMediaUpload('audio')}
                    disabled={isSending}
                  >
                    <Mic className="h-4 w-4 text-primary" />
                    <span>Audio</span>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="relative flex-1">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                disabled={isSending}
                className="pr-10"
              />
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-primary/10"
                  onClick={() => setShowIcebreakers(!showIcebreakers)}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isSending} 
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg hover:shadow-primary/50 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {showIcebreakers && messages.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg border animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Conversation Starters</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIcebreakers(getRandomIcebreakers(3))}
                className="h-6 text-xs hover:bg-primary/10"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              {icebreakers.map((icebreaker, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="justify-start text-left h-auto py-1.5 px-2 text-xs hover:bg-primary/10"
                  onClick={() => {
                    setNewMessage(icebreaker);
                    setShowIcebreakers(false);
                  }}
                >
                  {icebreaker}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
