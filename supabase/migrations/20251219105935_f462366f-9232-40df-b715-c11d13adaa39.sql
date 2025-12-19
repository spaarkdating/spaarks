-- Add social media handle columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_handle text,
ADD COLUMN IF NOT EXISTS twitter_handle text,
ADD COLUMN IF NOT EXISTS linkedin_handle text,
ADD COLUMN IF NOT EXISTS snapchat_handle text;