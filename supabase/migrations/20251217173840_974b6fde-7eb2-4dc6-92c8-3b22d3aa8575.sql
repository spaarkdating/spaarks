-- Allow users to update their own account_status (for deactivation)
-- Allow users to delete their own profile

-- Drop existing policies that we need to modify
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete user profiles" ON public.profiles;

-- Create new policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Super admins can still delete any profile
CREATE POLICY "Super admins can delete any profile"
ON public.profiles
FOR DELETE
USING (is_super_admin());

-- Allow moderators to update any profile (for ban/unban and verification)
DROP POLICY IF EXISTS "Moderators can update verification status" ON public.profiles;

CREATE POLICY "Moderators can update profiles"
ON public.profiles
FOR UPDATE
USING (is_moderator())
WITH CHECK (is_moderator());