-- Create profile_reports table for reporting suspicious user profiles
CREATE TABLE IF NOT EXISTS public.profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profile_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.profile_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.profile_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Moderators can view all reports
CREATE POLICY "Moderators can view all profile reports"
  ON public.profile_reports
  FOR SELECT
  TO authenticated
  USING (is_moderator());

-- Moderators can update reports
CREATE POLICY "Moderators can update profile reports"
  ON public.profile_reports
  FOR UPDATE
  TO authenticated
  USING (is_moderator());

-- Add index for better performance
CREATE INDEX idx_profile_reports_status ON public.profile_reports(status);
CREATE INDEX idx_profile_reports_created_at ON public.profile_reports(created_at DESC);