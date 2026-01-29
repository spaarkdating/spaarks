import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ArrowLeft, LogOut, Crown, UserCog, Headset, IdCard, CreditCard, Settings, IndianRupee, Package, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserManagement from "@/components/admin/UserManagement";
import SupportTickets from "@/components/admin/SupportTickets";
import PhotoReports from "@/components/admin/PhotoReports";
import ProfileReports from "@/components/admin/ProfileReports";
import Analytics from "@/components/admin/Analytics";
import AuditLogs from "@/components/admin/AuditLogs";
import AdminRoleManagement from "@/components/admin/AdminRoleManagement";
import { TestimonialManagement } from "@/components/admin/TestimonialManagement";
import { NewsletterManagement } from "@/components/admin/NewsletterManagement";
import { NewsletterHistory } from "@/components/admin/NewsletterHistory";
import { CouponManagement } from "@/components/admin/CouponManagement";
import { IdCardVerification } from "@/components/admin/IdCardVerification";
import { PaymentRequests } from "@/components/admin/PaymentRequests";
import PaymentSettings from "@/components/admin/PaymentSettings";
import { BankStatementProcessor } from "@/components/admin/BankStatementProcessor";
import Revenue from "@/components/admin/Revenue";
import DangerZone from "@/components/admin/DangerZone";
import SubscriptionPlansManagement from "@/components/admin/SubscriptionPlansManagement";
import ContactInquiries from "@/components/admin/ContactInquiries";
import { useToast } from "@/hooks/use-toast";
import { useAdminRole } from "@/hooks/useAdminRole";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading, isSuperAdmin, isModerator, isSupport, canManageUsers, canManageCoupons, canManageReports, canManageTickets, canViewAnalytics } = useAdminRole();
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: isAdminResult } = await supabase.rpc("is_admin");
      if (!isAdminResult) {
        navigate("/dashboard");
        return;
      }

      setAdminEmail(user.email || "");
    };

    checkAdmin();
  }, [navigate]);

  const getRoleBadge = () => {
    if (isSuperAdmin) return { label: "SUPER ADMIN", icon: <Crown className="h-4 w-4" />, variant: "destructive" as const };
    if (isModerator) return { label: "MODERATOR", icon: <UserCog className="h-4 w-4" />, variant: "default" as const };
    return { label: "SUPPORT", icon: <Headset className="h-4 w-4" />, variant: "secondary" as const };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading || !role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  const badge = getRoleBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b-2 border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4 p-3 bg-primary/10 border-l-4 border-primary rounded-r-lg">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">ADMIN MODE</span>
                  <Badge variant={badge.variant} className="animate-pulse flex items-center gap-1">
                    {badge.icon}
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Logged in as: {adminEmail}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue={canManageTickets ? "tickets" : undefined} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            {canViewAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="revenue">Revenue</TabsTrigger>}
            {canManageUsers && <TabsTrigger value="users">Users</TabsTrigger>}
            {isModerator && <TabsTrigger value="payments">Payments</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="payment-settings">Payment Settings</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="subscription-plans">Subscription Plans</TabsTrigger>}
            {isModerator && <TabsTrigger value="idcards">ID Cards</TabsTrigger>}
            {canManageTickets && <TabsTrigger value="tickets">Support</TabsTrigger>}
            {canManageTickets && <TabsTrigger value="inquiries">Contact Inquiries</TabsTrigger>}
            {canManageReports && <TabsTrigger value="reports">Reports</TabsTrigger>}
            {isModerator && <TabsTrigger value="testimonials">Testimonials</TabsTrigger>}
            {canManageCoupons && <TabsTrigger value="coupons">Coupons</TabsTrigger>}
            {isModerator && <TabsTrigger value="newsletter">Newsletter</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="roles">Admin Roles</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="danger" className="text-destructive">Danger Zone</TabsTrigger>}
          </TabsList>

          {canViewAnalytics && (
            <TabsContent value="analytics"><Analytics /></TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="revenue"><Revenue /></TabsContent>
          )}

          {canManageUsers && (
            <TabsContent value="users"><UserManagement /></TabsContent>
          )}

          {isModerator && (
            <TabsContent value="payments"><PaymentRequests /></TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="payment-settings">
              <div className="space-y-6">
                <PaymentSettings />
                <BankStatementProcessor />
              </div>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="subscription-plans"><SubscriptionPlansManagement /></TabsContent>
          )}

          {isModerator && (
            <TabsContent value="idcards"><IdCardVerification /></TabsContent>
          )}

          {canManageTickets && (
            <TabsContent value="tickets"><SupportTickets adminRole={role as any} /></TabsContent>
          )}

          {canManageTickets && (
            <TabsContent value="inquiries"><ContactInquiries adminRole={role as any} /></TabsContent>
          )}

          {canManageReports && (
            <TabsContent value="reports">
              <div className="space-y-6">
                <PhotoReports adminRole={role as any} />
                <ProfileReports adminRole={role as any} />
              </div>
            </TabsContent>
          )}

          {isModerator && (
            <>
              <TabsContent value="testimonials"><TestimonialManagement /></TabsContent>
              <TabsContent value="newsletter">
                <div className="space-y-6">
                  <NewsletterManagement />
                  <NewsletterHistory />
                </div>
              </TabsContent>
            </>
          )}

          {canManageCoupons && (
            <TabsContent value="coupons"><CouponManagement /></TabsContent>
          )}

          {isSuperAdmin && (
            <>
              <TabsContent value="roles"><AdminRoleManagement /></TabsContent>
              <TabsContent value="audit"><AuditLogs /></TabsContent>
              <TabsContent value="danger"><DangerZone /></TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
