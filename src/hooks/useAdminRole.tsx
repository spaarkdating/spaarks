import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin" | "moderator" | "support" | null;

interface AdminRoleHook {
  role: AdminRole;
  loading: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  isSupport: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageCoupons: boolean;
  canManageReports: boolean;
  canManageTickets: boolean;
}

export function useAdminRole(): AdminRoleHook {
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase.rpc("get_admin_role");
        if (error) throw error;
        setRole(data as AdminRole);
      } catch (error) {
        console.error("Error fetching admin role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return {
    role,
    loading,
    isSuperAdmin: role === "super_admin",
    isModerator: role === "super_admin" || role === "moderator",
    isSupport: role === "super_admin" || role === "moderator" || role === "support",
    canManageUsers: role === "super_admin" || role === "moderator",
    canViewAnalytics: role === "super_admin" || role === "moderator",
    canManageCoupons: role === "super_admin" || role === "moderator" || role === "support",
    canManageReports: role === "super_admin" || role === "moderator",
    canManageTickets: role === "super_admin" || role === "moderator" || role === "support",
  };
}
