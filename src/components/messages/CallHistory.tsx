import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CallHistoryProps {
  currentUserId: string;
  otherUserId: string;
}

interface CallSession {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  end_reason: string | null;
  created_at: string;
}

export const CallHistory = ({ currentUserId, otherUserId }: CallHistoryProps) => {
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCallHistory();
  }, [currentUserId, otherUserId]);

  const fetchCallHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("call_sessions")
        .select("*")
        .or(
          `and(caller_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(caller_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error("Error fetching call history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (call: CallSession) => {
    const isOutgoing = call.caller_id === currentUserId;
    const isMissed = call.status === "missed" || call.status === "declined" || call.status === "no_answer";

    if (isMissed) {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }

    if (call.call_type === "video") {
      return (
        <div className="relative">
          <Video className={cn("h-4 w-4", isOutgoing ? "text-blue-500" : "text-green-500")} />
          {isOutgoing ? (
            <PhoneOutgoing className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-blue-500" />
          ) : (
            <PhoneIncoming className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-green-500" />
          )}
        </div>
      );
    }

    return isOutgoing ? (
      <PhoneOutgoing className="h-4 w-4 text-blue-500" />
    ) : (
      <PhoneIncoming className="h-4 w-4 text-green-500" />
    );
  };

  const getCallDescription = (call: CallSession) => {
    const isOutgoing = call.caller_id === currentUserId;
    const callType = call.call_type === "video" ? "Video call" : "Voice call";

    switch (call.status) {
      case "completed":
      case "ended":
        return `${callType} • ${formatDuration(call.duration_seconds)}`;
      case "missed":
        return isOutgoing ? `${callType} • No answer` : `Missed ${callType.toLowerCase()}`;
      case "declined":
        return isOutgoing ? `${callType} • Declined` : `${callType} • You declined`;
      case "no_answer":
        return `${callType} • No answer`;
      case "busy":
        return `${callType} • Busy`;
      default:
        return callType;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Loading call history...
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No calls yet</p>
        <p className="text-xs mt-1">Start a call using the buttons above</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="space-y-1 p-2">
        {calls.map((call) => {
          const isOutgoing = call.caller_id === currentUserId;
          const isMissed = call.status === "missed" || call.status === "declined" || call.status === "no_answer";

          return (
            <div
              key={call.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isMissed ? "bg-destructive/5" : "hover:bg-muted/50"
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {getCallIcon(call)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  isMissed && "text-destructive"
                )}>
                  {isOutgoing ? "Outgoing" : "Incoming"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {getCallDescription(call)}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                </p>
                {call.started_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {format(new Date(call.started_at), "HH:mm")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
