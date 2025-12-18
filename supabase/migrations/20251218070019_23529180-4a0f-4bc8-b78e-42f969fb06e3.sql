-- First, delete duplicate profile views keeping only the most recent one
DELETE FROM public.profile_views a
USING public.profile_views b
WHERE a.id < b.id 
  AND a.viewer_id = b.viewer_id 
  AND a.viewed_profile_id = b.viewed_profile_id;

-- Add unique constraint to prevent duplicate views from same viewer
ALTER TABLE public.profile_views 
ADD CONSTRAINT unique_viewer_viewed UNIQUE (viewer_id, viewed_profile_id);