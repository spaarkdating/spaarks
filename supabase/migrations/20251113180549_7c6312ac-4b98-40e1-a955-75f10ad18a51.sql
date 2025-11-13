-- Add dating_mode column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dating_mode TEXT DEFAULT 'online' CHECK (dating_mode IN ('online', 'offline'));

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.dating_mode IS 'Indicates whether user prefers online or offline dating';
