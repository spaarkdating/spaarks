-- Add RLS policy to allow public unsubscribe (update to inactive)
CREATE POLICY "Anyone can unsubscribe from newsletter" 
ON public.newsletter_subscriptions 
FOR UPDATE 
USING (true)
WITH CHECK (is_active = false);

-- Add college column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college text;