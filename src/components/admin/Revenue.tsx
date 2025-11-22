import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalTransactions: number;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_type: string;
  description: string;
  created_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

const Revenue = () => {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    totalTransactions: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch total revenue
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount");
      
      const totalRevenue = allPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: monthlyPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

      // Fetch active subscriptions count
      const { count: activeSubsCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch total transactions count
      const { count: totalTransCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      // Fetch recent payments with user info
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions: activeSubsCount || 0,
        totalTransactions: totalTransCount || 0,
      });

      setRecentPayments(payments as any || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Monthly Revenue",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: Users,
      color: "text-purple-500",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions,
      icon: CreditCard,
      color: "text-orange-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading revenue data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest payment activities across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.profiles?.display_name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{payment.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.transaction_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(payment.amount).toFixed(2)} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={payment.status === "completed" ? "default" : "secondary"}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.description || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Revenue;