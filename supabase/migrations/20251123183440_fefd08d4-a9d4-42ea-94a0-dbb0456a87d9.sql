-- Create enum for admin action types
CREATE TYPE admin_action_type AS ENUM (
  'user_ban',
  'user_unban',
  'user_delete',
  'ticket_update',
  'ticket_resolve',
  'ticket_close',
  'report_approve',
  'report_reject',
  'role_change',
  'admin_create',
  'admin_delete'
);

-- Create admin audit logs table
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type admin_action_type NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_resource_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_target_user ON admin_audit_logs(target_user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_action_type ON admin_audit_logs(action_type);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (is_super_admin());

-- All admins can insert audit logs
CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (is_admin());

-- Add comment
COMMENT ON TABLE public.admin_audit_logs IS 'Tracks all administrative actions for compliance and security auditing';