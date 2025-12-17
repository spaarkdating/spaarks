import { supabase } from "@/integrations/supabase/client";

type AdminActionType =
  | "user_ban"
  | "user_unban"
  | "user_delete"
  | "ticket_update"
  | "ticket_resolve"
  | "ticket_close"
  | "report_approve"
  | "report_reject"
  | "role_change"
  | "admin_create"
  | "admin_delete"
  | "id_card_approved"
  | "id_card_rejected";

interface AuditLogParams {
  actionType: AdminActionType;
  targetUserId?: string;
  targetResourceId?: string;
  details?: Record<string, any>;
}

export async function logAdminAction({
  actionType,
  targetUserId,
  targetResourceId,
  details,
}: AuditLogParams) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action_type: actionType,
      target_user_id: targetUserId,
      target_resource_id: targetResourceId,
      details: details || {},
      ip_address: null, // Client-side can't reliably get IP
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
