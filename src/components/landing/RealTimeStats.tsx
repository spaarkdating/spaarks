import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface StatsData {
  activeUsers: number;
  totalMatches: number;
  avgRating: number;
  totalTestimonials: number;
}

export const RealTimeStats = () => {
  const [stats, setStats] = useState<StatsData>({
    activeUsers: 0,
    totalMatches: 0,
    avgRating: 0,
    totalTestimonials: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Use the secure database function to get stats
      const { data, error } = await supabase.rpc('get_public_stats');

      if (error) {
        console.error("Error fetching stats:", error);
        throw error;
      }

      console.log("Stats from database:", data);

      // Type assertion for the returned data
      const statsData = data as { 
        activeUsers: number; 
        totalMatches: number; 
        avgRating: number; 
        totalTestimonials: number;
      };

      setStats({
        activeUsers: statsData.activeUsers || 0,
        totalMatches: statsData.totalMatches || 0,
        avgRating: statsData.avgRating || 0,
        totalTestimonials: statsData.totalTestimonials || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Set default fallback stats to 0 instead of fake data
      setStats({
        activeUsers: 0,
        totalMatches: 0,
        avgRating: 0,
        totalTestimonials: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
      <AnimatedStatCard
        value={stats.activeUsers}
        label="Active Users"
        suffix="+"
        isLoading={isLoading}
      />
      <AnimatedStatCard
        value={stats.totalMatches}
        label="Matches Made"
        suffix="+"
        isLoading={isLoading}
      />
      <AnimatedStatCard
        value={stats.totalTestimonials}
        label="Success Stories"
        suffix="+"
        isLoading={isLoading}
      />
      <AnimatedStatCard
        value={stats.avgRating}
        label="User Rating"
        suffix="★"
        decimals={1}
        isLoading={isLoading}
      />
    </div>
  );
};

interface AnimatedStatCardProps {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
  isLoading: boolean;
}

const AnimatedStatCard = ({ value, label, suffix = "", decimals = 0, isLoading }: AnimatedStatCardProps) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString()
  );

  useEffect(() => {
    if (!isLoading && value > 0) {
      const animation = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return animation.stop;
    }
  }, [value, isLoading, count]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-4xl md:text-5xl font-bold gradient-text mb-2 h-14 flex items-center justify-center">
          <div className="h-10 w-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded animate-pulse" />
        </div>
        <div className="text-muted-foreground">{label}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <motion.div className="text-4xl md:text-5xl font-bold gradient-text mb-2 flex items-center justify-center gap-1">
        <motion.span>{rounded}</motion.span>
        {suffix && <span className="text-3xl md:text-4xl">{suffix}</span>}
      </motion.div>
      <div className="text-muted-foreground">{label}</div>
    </motion.div>
  );
};
