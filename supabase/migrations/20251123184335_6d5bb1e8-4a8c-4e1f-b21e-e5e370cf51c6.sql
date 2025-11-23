-- Add RLS policy to allow super admins to delete user profiles
CREATE POLICY "Super admins can delete user profiles"
  ON public.profiles
  FOR DELETE
  USING (is_super_admin());

-- Ensure admin_users has proper insert policy with check
-- (recreate to ensure it's correct)
DROP POLICY IF EXISTS "Admins can create audit logs" ON public.admin_users;

CREATE POLICY "Super admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (is_super_admin());