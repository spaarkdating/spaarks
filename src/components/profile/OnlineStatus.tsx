import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
}

export const OnlineStatus = ({ userId, showLabel = false }: OnlineStatusProps) => {
  const [lastOnline, setLastOnline] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    fetchOnlineStatus();
    
    const interval = setInterval(fetchOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchOnlineStatus = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("last_online")
      .eq("id", userId)
      .single();

    if (data?.last_online) {
      setLastOnline(data.last_online);
      const minutesSinceOnline = (Date.now() - new Date(data.last_online).getTime()) / 1000 / 60;
      setIsOnline(minutesSinceOnline < 5);
    }
  };

  const getStatusText = () => {
    if (isOnline) return "Online now";
    if (!lastOnline) return "Offline";
    return `Active ${formatDistanceToNow(new Date(lastOnline), { addSuffix: true })}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`h-3 w-3 rounded-full ${
            isOnline ? "bg-online" : "bg-offline"
          }`}
        />
        {isOnline && (
          <div className="absolute inset-0 h-3 w-3 rounded-full bg-online animate-ping opacity-75" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{getStatusText()}</span>
      )}
    </div>
  );
};
