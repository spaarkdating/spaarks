-- Drop all possible existing constraints
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS valid_admin_role;

-- Clean up existing role values
UPDATE public.admin_users 
SET role = CASE
  WHEN role IN ('super_admin', 'moderator', 'support') THEN role
  ELSE 'super_admin'
END;

-- Set default to moderator
ALTER TABLE public.admin_users ALTER COLUMN role SET DEFAULT 'moderator';

-- Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'moderator')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'moderator', 'support')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.admin_users
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Update RLS policies for support tickets (support can view and update)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

CREATE POLICY "Support staff can view all tickets"
ON public.support_tickets
FOR SELECT
USING (is_support());

CREATE POLICY "Support staff can update tickets"
ON public.support_tickets
FOR UPDATE
USING (is_support());

-- Update RLS policies for photo reports (moderators can manage)
DROP POLICY IF EXISTS "Admins can view all photo reports" ON public.photo_reports;
DROP POLICY IF EXISTS "Admins can update photo reports" ON public.photo_reports;

CREATE POLICY "Moderators can view all photo reports"
ON public.photo_reports
FOR SELECT
USING (is_moderator());

CREATE POLICY "Moderators can update photo reports"
ON public.photo_reports
FOR UPDATE
USING (is_moderator());

-- Update RLS policies for user management (super admins only)
DROP POLICY IF EXISTS "Full admins can update user status" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update user status" ON public.profiles;

CREATE POLICY "Super admins can update user status"
ON public.profiles
FOR UPDATE
USING (is_super_admin());

-- Update payment and subscription viewing (super admins only)
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

CREATE POLICY "Super admins can view all payments"
ON public.payments
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (is_super_admin());

-- Create admin_users management policy (super admins only)
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;

CREATE POLICY "Super admins can manage admin users"
ON public.admin_users
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
USING (is_admin());

-- Enable RLS on admin_users if not already enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;