import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Sparkles, Image, Video, Mic, X, ArrowLeft, Check, CheckCheck, Smile, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow, format } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getRandomIcebreakers } from "@/data/icebreakers";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatWindowProps {
  match: any;
  currentUserId: string;
  onMessagesUpdate: () => void;
  onBack?: () => void;
}

// Common emoji reactions
const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// Delete for everyone time window (15 minutes in milliseconds)
const DELETE_FOR_EVERYONE_WINDOW = 15 * 60 * 1000;

export const ChatWindow = ({ match, currentUserId, onMessagesUpdate, onBack }: ChatWindowProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, any[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<any>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ file: File; type: 'image' | 'video' | 'audio'; preview: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
    fetchReactions();
    const icebreakerTimeout = setTimeout(() => {
      setIcebreakers(getRandomIcebreakers(3));
    }, 800);
    setupRealtimeSubscription();

    return () => {
      clearTimeout(icebreakerTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      stopRecording();
    };
  }, [match]);

  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone.current) {
      // Only auto-scroll on initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
        initialScrollDone.current = true;
      }, 100);
    }
  }, [messages.length > 0]);

  useEffect(() => {
    initialScrollDone.current = false;
  }, [match?.id]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchReactions = async () => {
    if (!match) return;

    const messageIds = messages.map(m => m.id);
    if (messageIds.length === 0) return;

    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .in("message_id", messageIds);

    if (data) {
      const grouped: Record<string, any[]> = {};
      data.forEach(reaction => {
        if (!grouped[reaction.message_id]) {
          grouped[reaction.message_id] = [];
        }
        grouped[reaction.message_id].push(reaction);
      });
      setReactions(grouped);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      fetchReactions();
    }
  }, [messages]);

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      // Check if reaction already exists
      const existingReaction = reactions[messageId]?.find(
        r => r.user_id === currentUserId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from("message_reactions")
          .delete()
          .eq("id", existingReaction.id);
      } else {
        // Add reaction
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: currentUserId,
          emoji,
        });
      }

      fetchReactions();
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Check if message can be deleted for everyone (within 15 min window)
  const canDeleteForEveryone = (message: any) => {
    if (message.sender_id !== currentUserId) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    return now - messageTime <= DELETE_FOR_EVERYONE_WINDOW;
  };

  // Handle delete message
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const updateData: any = {
        deleted_at: new Date().toISOString(),
        deleted_by: currentUserId,
      };

      if (deleteForEveryone && canDeleteForEveryone(messageToDelete)) {
        updateData.deleted_for_everyone = true;
      }

      const { error } = await supabase
        .from("messages")
        .update(updateData)
        .eq("id", messageToDelete.id);

      if (error) throw error;

      // Update local state
      setMessages(current =>
        current.map(msg =>
          msg.id === messageToDelete.id
            ? { ...msg, ...updateData }
            : msg
        )
      );

      toast({
        title: "Message deleted",
        description: deleteForEveryone ? "Message deleted for everyone" : "Message deleted for you",
      });
    } catch (error: any) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
      setDeleteForEveryone(false);
    }
  };

  const openDeleteDialog = (message: any, forEveryone: boolean = false) => {
    setMessageToDelete(message);
    setDeleteForEveryone(forEveryone);
    setDeleteDialogOpen(true);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use audio/mp4 as primary format (widely supported), fallback to ogg, then webm
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
          ? 'audio/ogg' 
          : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice messages.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      // Use the same mime type detection as startRecording
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
        ? 'audio/mp4' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
          ? 'audio/ogg' 
          : 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const fileExt = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

      if (audioBlob.size > 10 * 1024 * 1024) {
        toast({
          title: "Recording too long",
          description: "Please record a shorter message.",
          variant: "destructive",
        });
        return;
      }

      setIsSending(true);
      try {
        const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(fileName, audioBlob, { contentType: mimeType });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);
        
        const { error } = await supabase.from("messages").insert({
          sender_id: currentUserId,
          receiver_id: match.liked_user_id,
          content: `[VOICE]${publicUrl}`,
        });

        if (error) throw error;

        await (supabase as any).from("notifications").insert({
          user_id: match.liked_user_id,
          type: "message",
          title: "New Voice Message",
          message: `You received a voice message from ${match.profile.display_name}`,
          data: { match_id: match.id, sender_id: currentUserId },
        });

        onMessagesUpdate();
        toast({
          title: "Sent!",
          description: "Your voice message has been sent.",
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to send voice message.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };

    stopRecording();
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMediaUpload = async (type: 'image' | 'video' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file under 10MB",
          variant: "destructive",
        });
        return;
      }

      // Create preview and show confirmation dialog
      const preview = URL.createObjectURL(file);
      setPendingMedia({ file, type, preview });
      setShowMediaOptions(false);
    };
    
    input.click();
  };

  const cancelMediaSend = () => {
    if (pendingMedia?.preview) {
      URL.revokeObjectURL(pendingMedia.preview);
    }
    setPendingMedia(null);
  };

  const confirmMediaSend = async () => {
    if (!pendingMedia) return;

    setIsSending(true);
    try {
      const fileExt = pendingMedia.file.name.split('.').pop();
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, pendingMedia.file, { contentType: pendingMedia.file.type || undefined });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);
      
      const mediaPrefix = pendingMedia.type === 'image' ? '[IMAGE]' : pendingMedia.type === 'video' ? '[VIDEO]' : '[AUDIO]';
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: match.liked_user_id,
        content: `${mediaPrefix}${publicUrl}`,
      });

      if (error) throw error;

      await (supabase as any).from("notifications").insert({
        user_id: match.liked_user_id,
        type: "message",
        title: "New Message",
        message: `You received a ${pendingMedia.type} from ${match.profile.display_name}`,
        data: { match_id: match.id, sender_id: currentUserId },
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);

      onMessagesUpdate();
      toast({
        title: "Sent!",
        description: `Your ${pendingMedia.type} has been sent.`,
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
      if (pendingMedia?.preview) {
        URL.revokeObjectURL(pendingMedia.preview);
      }
      setPendingMedia(null);
    }
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

    const now = new Date().toISOString();
    await supabase
      .from("messages")
      .update({ read: true, read_at: now })
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          fetchReactions();
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

  // Render read receipt status
  const renderReadStatus = (message: any, isSender: boolean) => {
    if (!isSender) return null;

    if (message.read && message.read_at) {
      return (
        <span className="flex items-center gap-1 text-xs opacity-70" title={`Seen ${format(new Date(message.read_at), 'MMM d, h:mm a')}`}>
          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
        </span>
      );
    } else if (message.read) {
      return (
        <span className="flex items-center gap-1 text-xs opacity-70">
          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-xs opacity-50">
          <Check className="h-3.5 w-3.5" />
        </span>
      );
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
    <div className="bg-card rounded-2xl border border-border flex flex-col h-full relative overflow-hidden pb-16 md:pb-0">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
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
          const messageReactions = reactions[message.id] || [];
          
          // Check if message is deleted
          const isDeleted = message.deleted_at !== null;
          const isDeletedForEveryone = message.deleted_for_everyone;
          const wasDeletedByMe = message.deleted_by === currentUserId;
          
          // Hide message if deleted for everyone, or show "deleted" placeholder
          if (isDeleted) {
            // If deleted for everyone, show placeholder for both users
            // If deleted only for sender, only sender sees placeholder
            if (isDeletedForEveryone || wasDeletedByMe) {
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] min-w-[120px] rounded-2xl px-4 py-2 ${
                      isSender
                        ? "bg-primary/30 text-primary-foreground/70"
                        : "bg-muted/50 text-muted-foreground"
                    } border border-dashed border-border`}
                  >
                    <p className="text-sm italic flex items-center gap-2">
                      <Trash2 className="h-3 w-3" />
                      {isDeletedForEveryone ? "This message was deleted" : "You deleted this message"}
                    </p>
                    <span className="text-xs opacity-50">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            }
            // If not deleted for everyone and not deleted by current user, skip
            if (!isDeletedForEveryone && !wasDeletedByMe) {
              // Show nothing - the other user deleted it only for themselves
            }
          }
          
          const isImage = content.startsWith('[IMAGE]');
          const isVideo = content.startsWith('[VIDEO]');
          const isAudio = content.startsWith('[AUDIO]');
          const isVoice = content.startsWith('[VOICE]');
          const mediaUrl = isImage ? content.slice(7) : isVideo ? content.slice(7) : isAudio ? content.slice(7) : isVoice ? content.slice(7) : null;
          
          return (
            <div
              key={message.id}
              className={`flex w-full ${isSender ? "justify-end" : "justify-start"} group`}
            >
              <div className={`relative max-w-[75%] md:max-w-[70%] ${isSender ? 'ml-auto' : 'mr-auto'}`}>
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isSender
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {isImage && mediaUrl ? (
                    <img 
                      src={mediaUrl} 
                      alt="Shared image" 
                      className="max-w-[250px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                      onClick={() => window.open(mediaUrl, '_blank')}
                    />
                  ) : isVideo && mediaUrl ? (
                    <video 
                      src={mediaUrl} 
                      controls 
                      className="max-w-[250px] rounded-lg"
                    />
                  ) : (isAudio || isVoice) && mediaUrl ? (
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 flex-shrink-0" />
                      <audio 
                        src={mediaUrl} 
                        controls 
                        className="max-w-[200px] h-8"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">{content}</p>
                  )}
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {renderReadStatus(message, isSender)}
                  </div>
                </div>

                {/* Reactions display */}
                {messageReactions.length > 0 && (
                  <div className={`absolute -bottom-3 ${isSender ? 'right-2' : 'left-2'} flex gap-0.5 bg-card rounded-full px-1.5 py-0.5 shadow-md border border-border`}>
                    {Object.entries(
                      messageReactions.reduce((acc: Record<string, number>, r: any) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <span key={emoji} className="text-xs flex items-center">
                        {emoji}{(count as number) > 1 && <span className="ml-0.5 text-[10px] text-muted-foreground">{count as number}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message actions (reaction + delete menu) - positioned inside message bubble for mobile */}
                <div className={`absolute ${isSender ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity`}>
                  {/* Reaction button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-card border border-border shadow-sm"
                      >
                        <Smile className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-2 z-50" 
                      side="top" 
                      align="center"
                      sideOffset={5}
                      collisionPadding={16}
                    >
                      <div className="flex gap-1">
                        {EMOJI_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(message.id, emoji)}
                            className={`text-lg hover:scale-125 transition-transform p-1 rounded ${
                              messageReactions.some(r => r.user_id === currentUserId && r.emoji === emoji)
                                ? 'bg-primary/20'
                                : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Delete menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 bg-card border border-border shadow-sm"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isSender ? "end" : "start"} className="z-50">
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(message, false)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete for me
                      </DropdownMenuItem>
                      {isSender && canDeleteForEveryone(message) && (
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(message, true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete for everyone
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

        {/* Recording UI */}
        {isRecording && (
          <div className="flex items-center justify-between bg-destructive/10 rounded-lg px-4 py-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording... {formatRecordingTime(recordingTime)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopRecording}
                className="text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={sendVoiceMessage}
                className="bg-primary"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        )}

        {!isRecording && (
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
                      <span>Audio File</span>
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

              {/* Voice record button (tap to start, then use the recording bar to send/cancel) */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 hover:bg-primary/10 ${isRecording ? 'bg-destructive/10 text-destructive' : ''}`}
                onClick={async (e) => {
                  e.preventDefault();
                  if (isSending) return;
                  if (!isRecording) {
                    await startRecording();
                  }
                }}
                disabled={isSending}
                title={isRecording ? "Recording…" : "Record voice message"}
              >
                <Mic className="h-5 w-5" />
              </Button>

              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending} 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg hover:shadow-primary/50 transition-all"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

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

      {/* Media Preview Confirmation Dialog */}
      <AlertDialog open={!!pendingMedia} onOpenChange={(open) => !open && cancelMediaSend()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Send {pendingMedia?.type}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">Preview your {pendingMedia?.type} before sending:</span>
              {pendingMedia?.type === 'image' && (
                <img 
                  src={pendingMedia.preview} 
                  alt="Preview" 
                  className="max-w-full max-h-[300px] rounded-lg mx-auto object-contain"
                />
              )}
              {pendingMedia?.type === 'video' && (
                <video 
                  src={pendingMedia.preview} 
                  controls 
                  className="max-w-full max-h-[300px] rounded-lg mx-auto"
                />
              )}
              {pendingMedia?.type === 'audio' && (
                <audio 
                  src={pendingMedia.preview} 
                  controls 
                  className="w-full"
                />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelMediaSend} disabled={isSending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMediaSend}
              disabled={isSending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSending ? "Sending..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteForEveryone 
                ? "This message will be deleted for everyone in this conversation. This action cannot be undone."
                : "This message will be deleted for you. The other person will still be able to see it."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setMessageToDelete(null);
              setDeleteForEveryone(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
