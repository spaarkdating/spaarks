import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserManagement from "@/components/admin/UserManagement";
import SupportTickets from "@/components/admin/SupportTickets";
import PhotoReports from "@/components/admin/PhotoReports";
import Analytics from "@/components/admin/Analytics";
import Revenue from "@/components/admin/Revenue";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: adminData } = await (supabase as any)
        .from("admin_users")
        .select("role, email")
        .eq("user_id", user.id)
        .single();

      if (!adminData) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      setAdminEmail(adminData.email);
      setLoading(false);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b-2 border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          {/* Admin Mode Banner */}
          <div className="flex items-center justify-between mb-4 p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">ADMIN MODE</span>
                  <Badge variant="destructive" className="animate-pulse">RESTRICTED ACCESS</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Logged in as: {adminEmail}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          
          {/* Dashboard Header */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Dashboard
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="reports">Photo Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="revenue">
            <Revenue />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="tickets">
            <SupportTickets />
          </TabsContent>

          <TabsContent value="reports">
            <PhotoReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
