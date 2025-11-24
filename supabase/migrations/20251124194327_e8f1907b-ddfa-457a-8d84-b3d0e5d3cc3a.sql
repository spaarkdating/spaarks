-- Create newsletter_history table to track sent newsletters
CREATE TABLE IF NOT EXISTS public.newsletter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_history ENABLE ROW LEVEL SECURITY;

-- Super admins can view all newsletter history
CREATE POLICY "Super admins can view newsletter history"
  ON public.newsletter_history
  FOR SELECT
  USING (is_super_admin());

-- Super admins can insert newsletter history
CREATE POLICY "Super admins can insert newsletter history"
  ON public.newsletter_history
  FOR INSERT
  WITH CHECK (is_super_admin());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_newsletter_history_sent_at ON public.newsletter_history(sent_at DESC);