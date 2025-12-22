-- Add UPDATE policy for profile_views to allow upsert operations
CREATE POLICY "Users can update profile views"
ON public.profile_views
FOR UPDATE
TO authenticated
USING (auth.uid() = viewer_id)
WITH CHECK (auth.uid() = viewer_id);

