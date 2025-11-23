-- Add last_swipe tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_swipe_match_id uuid REFERENCES public.matches(id),
ADD COLUMN IF NOT EXISTS last_swipe_timestamp timestamp with time zone;

-- Create boost_purchases table for profile boost feature
CREATE TABLE IF NOT EXISTS public.boost_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  duration_minutes integer NOT NULL,
  amount_paid numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boost_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for boost_purchases
CREATE POLICY "Users can view their own boosts"
  ON public.boost_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boosts"
  ON public.boost_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for active boosts lookup
CREATE INDEX IF NOT EXISTS idx_boost_purchases_active 
  ON public.boost_purchases(user_id, expires_at) 
  WHERE status = 'active';

-- Function to check if user has active boost
CREATE OR REPLACE FUNCTION public.has_active_boost(user_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boost_purchases
    WHERE user_id = user_profile_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;