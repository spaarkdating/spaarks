import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";

interface ConversationListProps {
  matches: any[];
  selectedMatch: any;
  onSelectMatch: (match: any) => void;
  currentUserId: string;
}

export const ConversationList = ({
  matches,
  selectedMatch,
  onSelectMatch,
  currentUserId,
}: ConversationListProps) => {
  if (matches.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center h-full">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground text-center">
          Start swiping to match with people and begin chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Conversations</h2>
        <p className="text-sm text-muted-foreground">{matches.length} matches</p>
      </div>
      <div className="overflow-y-auto flex-1">
        {matches.map((match) => {
          const profile = match.profile;
          const photo = profile?.photos?.[0]?.photo_url || "/placeholder.svg";
          const lastMessage = match.lastMessage;
          const isUnread = lastMessage && !lastMessage.read && lastMessage.sender_id !== currentUserId;
          const isSelected = selectedMatch?.id === match.id;

          return (
            <button
              key={match.id}
              onClick={() => onSelectMatch(match)}
              className={`w-full p-4 flex gap-3 hover:bg-muted/50 transition-colors border-b border-border ${
                isSelected ? "bg-muted" : ""
              }`}
            >
              <div className="relative">
                <img
                  src={photo}
                  alt={profile.display_name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {isUnread && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold truncate">{profile.display_name}</h3>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {lastMessage ? (
                  <p className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {lastMessage.sender_id === currentUserId ? "You: " : ""}
                    {lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
