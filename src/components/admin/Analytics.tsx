import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, MessageCircle, AlertTriangle, UserCheck, Ban } from "lucide-react";

const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    pendingReports: 0,
    openTickets: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats
      const profilesResult: any = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const matchesResult: any = await supabase.from("matches").select("*", { count: "exact", head: true }).eq("is_match", true);
      const messagesResult: any = await supabase.from("messages").select("*", { count: "exact", head: true });
      
      // Count active/banned manually from profiles
      const { data: allProfiles } = await supabase.from("profiles").select("account_status");
      const activeCount = allProfiles?.filter((p: any) => p.account_status === "active").length || 0;
      const bannedCount = allProfiles?.filter((p: any) => p.account_status === "banned").length || 0;

      // Count reports and tickets
      const reportsResult: any = await (supabase as any).from("photo_reports").select("*", { count: "exact", head: true }).eq("status", "pending");
      const ticketsResult: any = await (supabase as any).from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]);

      setStats({
        totalUsers: profilesResult.count || 0,
        activeUsers: activeCount,
        bannedUsers: bannedCount,
        totalMatches: matchesResult.count || 0,
        totalMessages: messagesResult.count || 0,
        pendingReports: reportsResult.count || 0,
        openTickets: ticketsResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "text-green-500",
    },
    {
      title: "Banned Users",
      value: stats.bannedUsers,
      icon: Ban,
      color: "text-red-500",
    },
    {
      title: "Total Matches",
      value: stats.totalMatches,
      icon: Heart,
      color: "text-pink-500",
    },
    {
      title: "Total Messages",
      value: stats.totalMessages,
      icon: MessageCircle,
      color: "text-purple-500",
    },
    {
      title: "Pending Reports",
      value: stats.pendingReports,
      icon: AlertTriangle,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Analytics;
