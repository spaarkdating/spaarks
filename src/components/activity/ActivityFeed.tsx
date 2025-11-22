import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Eye, MessageCircle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "like" | "view" | "match" | "message";
  user: {
    id: string;
    display_name: string;
    photo_url?: string;
  };
  timestamp: string;
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const activities: ActivityItem[] = [];

      // Fetch recent matches
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          id,
          created_at,
          liked_user:profiles!matches_liked_user_id_fkey(id, display_name),
          user:profiles!matches_user_id_fkey(id, display_name)
        `)
        .eq("user_id", user.id)
        .eq("is_match", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (matches) {
        for (const match of matches) {
          const profile = match.liked_user;
          const { data: photo } = await supabase
            .from("photos")
            .select("photo_url")
            .eq("user_id", profile.id)
            .order("display_order")
            .limit(1)
            .single();

          activities.push({
            id: match.id,
            type: "match",
            user: {
              id: profile.id,
              display_name: profile.display_name || "Someone",
              photo_url: photo?.photo_url,
            },
            timestamp: match.created_at,
          });
        }
      }

      // Fetch recent profile views
      const { data: views } = await supabase
        .from("profile_views")
        .select(`
          id,
          viewed_at,
          viewer:profiles!profile_views_viewer_id_fkey(id, display_name)
        `)
        .eq("viewed_profile_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(5);

      if (views) {
        for (const view of views) {
          const { data: photo } = await supabase
            .from("photos")
            .select("photo_url")
            .eq("user_id", view.viewer.id)
            .order("display_order")
            .limit(1)
            .single();

          activities.push({
            id: view.id,
            type: "view",
            user: {
              id: view.viewer.id,
              display_name: view.viewer.display_name || "Someone",
              photo_url: photo?.photo_url,
            },
            timestamp: view.viewed_at,
          });
        }
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "match":
        return <Sparkles className="h-5 w-5 text-primary" />;
      case "like":
        return <Heart className="h-5 w-5 text-primary fill-primary" />;
      case "view":
        return <Eye className="h-5 w-5 text-accent" />;
      case "message":
        return <MessageCircle className="h-5 w-5 text-secondary" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "match":
        return "matched with you";
      case "like":
        return "liked your profile";
      case "view":
        return "viewed your profile";
      case "message":
        return "sent you a message";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Recent Activity
      </h3>
      
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No recent activity yet</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={activity.user.photo_url} />
                <AvatarFallback>{activity.user.display_name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{activity.user.display_name}</span>{" "}
                  <span className="text-muted-foreground">{getActivityText(activity)}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
              
              <div>{getActivityIcon(activity.type)}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
