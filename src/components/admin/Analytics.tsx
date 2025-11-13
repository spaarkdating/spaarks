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
    const fetchStats = async () => {
      // Fetch stats separately to avoid TypeScript inference issues
      const totalUsersResult = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const activeUsersResult = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status" as any, "active");
      const bannedUsersResult = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("account_status" as any, "banned");
      const totalMatchesResult = await supabase.from("matches").select("*", { count: "exact", head: true }).eq("is_match", true);
      const totalMessagesResult = await supabase.from("messages").select("*", { count: "exact", head: true });
      const pendingReportsResult = await (supabase as any).from("photo_reports").select("*", { count: "exact", head: true }).eq("status", "pending");
      const openTicketsResult = await (supabase as any).from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]);

      setStats({
        totalUsers: totalUsersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        bannedUsers: bannedUsersResult.count || 0,
        totalMatches: totalMatchesResult.count || 0,
        totalMessages: totalMessagesResult.count || 0,
        pendingReports: pendingReportsResult.count || 0,
        openTickets: openTicketsResult.count || 0,
      });
    };

    fetchStats();
  }, []);

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
