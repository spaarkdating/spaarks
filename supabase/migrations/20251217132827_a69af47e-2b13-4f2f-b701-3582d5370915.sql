-- Allow moderators to update profile verification_status
CREATE POLICY "Moderators can update verification status" 
ON public.profiles 
FOR UPDATE 
USING (is_moderator())
WITH CHECK (is_moderator());