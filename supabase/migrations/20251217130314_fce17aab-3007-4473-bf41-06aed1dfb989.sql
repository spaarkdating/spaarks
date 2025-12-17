-- Create table for ID card verifications
CREATE TABLE public.id_card_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.id_card_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification status
CREATE POLICY "Users can view own verification"
ON public.id_card_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can submit their own verification (only once due to unique constraint)
CREATE POLICY "Users can submit verification"
ON public.id_card_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending verification (resubmit)
CREATE POLICY "Users can update pending verification"
ON public.id_card_verifications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Moderators can view all verifications
CREATE POLICY "Moderators can view all verifications"
ON public.id_card_verifications
FOR SELECT
USING (is_moderator());

-- Moderators can update verifications (approve/reject)
CREATE POLICY "Moderators can update verifications"
ON public.id_card_verifications
FOR UPDATE
USING (is_moderator());

-- Create storage bucket for ID cards (private, not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ID cards
CREATE POLICY "Users can upload own ID cards"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own ID cards"
ON storage.objects
FOR SELECT
USING (bucket_id = 'id-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Moderators can view all ID cards"
ON storage.objects
FOR SELECT
USING (bucket_id = 'id-cards' AND is_moderator());

-- Update profiles to have verification_status column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));