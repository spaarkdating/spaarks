-- Add check constraint to ensure only valid admin roles
ALTER TABLE public.admin_users 
ADD CONSTRAINT valid_admin_role 
CHECK (role IN ('admin', 'moderator'));

-- Create a function to check if user is full admin (not moderator)
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
$$;

-- Update RLS policies for user management operations
-- Only full admins can update profile account_status (ban/unban)
CREATE POLICY "Full admins can update user status"
ON public.profiles
FOR UPDATE
USING (is_full_admin());