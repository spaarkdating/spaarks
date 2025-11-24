import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Users, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  type: "match" | "signup" | "testimonial";
  message: string;
  timestamp: Date;
  icon: any;
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch initial recent activities
    fetchRecentActivities();

    // Subscribe to new matches
    const matchChannel = supabase
      .channel("match-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: "is_match=eq.true"
        },
        () => {
          addActivity({
            type: "match",
            message: "New match made!",
            icon: Heart
          });
        }
      )
      .subscribe();

    // Subscribe to new profiles (signups)
    const profileChannel = supabase
      .channel("profile-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles"
        },
        () => {
          addActivity({
            type: "signup",
            message: "Someone just joined Spaark!",
            icon: Users
          });
        }
      )
      .subscribe();

    // Subscribe to new testimonials
    const testimonialChannel = supabase
      .channel("testimonial-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "testimonials",
          filter: "status=eq.approved"
        },
        () => {
          addActivity({
            type: "testimonial",
            message: "New success story shared!",
            icon: Star
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(testimonialChannel);
    };
  }, []);

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent matches
      const { data: matches } = await supabase
        .from("matches")
        .select("id, created_at")
        .eq("is_match", true)
        .order("created_at", { ascending: false })
        .limit(2);

      // Fetch recent profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(2);

      // Fetch recent testimonials
      const { data: testimonials } = await supabase
        .from("testimonials")
        .select("id, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(2);

      const initialActivities: Activity[] = [];

      matches?.forEach((match) => {
        initialActivities.push({
          id: match.id,
          type: "match",
          message: "New match made!",
          timestamp: new Date(match.created_at),
          icon: Heart
        });
      });

      profiles?.forEach((profile) => {
        initialActivities.push({
          id: profile.id,
          type: "signup",
          message: "Someone just joined Spaark!",
          timestamp: new Date(profile.created_at),
          icon: Users
        });
      });

      testimonials?.forEach((testimonial) => {
        initialActivities.push({
          id: testimonial.id,
          type: "testimonial",
          message: "New success story shared!",
          timestamp: new Date(testimonial.created_at),
          icon: Star
        });
      });

      // Sort by timestamp and take the 5 most recent
      initialActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(initialActivities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const addActivity = (activityData: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      ...activityData
    };

    setActivities((prev) => [newActivity, ...prev].slice(0, 5));
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "match":
        return "from-primary to-primary-glow";
      case "signup":
        return "from-accent to-primary";
      case "testimonial":
        return "from-primary-glow to-accent";
      default:
        return "from-primary to-accent";
    }
  };

  return (
    <section className="container mx-auto px-4 py-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold">Live Activity</h2>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-lg text-white/90">See what's happening right now on Spaark</p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.8 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`bg-gradient-to-r ${getActivityColor(activity.type)} p-4 rounded-2xl shadow-lg hover:shadow-glow transition-all hover:scale-105 group`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <activity.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{activity.message}</p>
                  <p className="text-white/70 text-sm">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-white"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-white/70"
          >
            <p>Waiting for activity...</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
