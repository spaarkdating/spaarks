-- Create blocked_users table for blocking functionality
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  UNIQUE(user_id, blocked_user_id)
);

-- Create profile_views table to track who viewed whose profile
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add min_age and max_age preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN min_age INTEGER DEFAULT 18,
ADD COLUMN max_age INTEGER DEFAULT 99;

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
ON public.blocked_users
FOR SELECT
USING (auth.uid() = user_id);

-- Users can block other users
CREATE POLICY "Users can block others"
ON public.blocked_users
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unblock
CREATE POLICY "Users can unblock"
ON public.blocked_users
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Users can view who viewed their profile
CREATE POLICY "Users can see who viewed them"
ON public.profile_views
FOR SELECT
USING (auth.uid() = viewed_profile_id);

-- System can create profile views
CREATE POLICY "System can create profile views"
ON public.profile_views
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);
CREATE INDEX idx_profile_views_viewer_id ON public.profile_views(viewer_id);
CREATE INDEX idx_profile_views_viewed_profile_id ON public.profile_views(viewed_profile_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at DESC);