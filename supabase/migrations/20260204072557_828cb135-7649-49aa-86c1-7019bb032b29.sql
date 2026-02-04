-- Add call-related columns to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS can_audio_call boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_video_call boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_calls_per_day integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_calls_per_day integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS call_duration_limit_minutes integer DEFAULT 0;

-- Update plan limits for calls
-- Free: No calls
UPDATE public.subscription_plans SET 
  can_audio_call = false,
  can_video_call = false,
  audio_calls_per_day = 0,
  video_calls_per_day = 0,
  call_duration_limit_minutes = 0
WHERE name = 'free';

-- Plus: Audio calls only (3 per day, 5 min limit)
UPDATE public.subscription_plans SET 
  can_audio_call = true,
  can_video_call = false,
  audio_calls_per_day = 3,
  video_calls_per_day = 0,
  call_duration_limit_minutes = 5
WHERE name = 'plus';

-- Pro: Audio + Video (5 calls each per day, 15 min limit)
UPDATE public.subscription_plans SET 
  can_audio_call = true,
  can_video_call = true,
  audio_calls_per_day = 5,
  video_calls_per_day = 3,
  call_duration_limit_minutes = 15
WHERE name = 'pro';

-- Elite: Unlimited calls
UPDATE public.subscription_plans SET 
  can_audio_call = true,
  can_video_call = true,
  audio_calls_per_day = NULL,
  video_calls_per_day = NULL,
  call_duration_limit_minutes = NULL
WHERE name = 'elite';

-- Create call_sessions table to track active and completed calls
CREATE TABLE public.call_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined', 'busy')),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  end_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for efficient queries
CREATE INDEX idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX idx_call_sessions_receiver ON public.call_sessions(receiver_id);
CREATE INDEX idx_call_sessions_status ON public.call_sessions(status);

-- Enable RLS
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own calls
CREATE POLICY "Users can view own calls" 
ON public.call_sessions 
FOR SELECT 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Users can create calls
CREATE POLICY "Users can create calls" 
ON public.call_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id AND are_users_matched(caller_id, receiver_id));

-- Users can update calls they're part of
CREATE POLICY "Users can update own calls" 
ON public.call_sessions 
FOR UPDATE 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Add usage tracking for calls
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS audio_calls_made integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_calls_made integer DEFAULT 0;

-- Update get_user_plan_limits function to include call limits
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_plan subscription_plan;
  is_founder boolean;
  plan_limits jsonb;
  multiplier numeric;
BEGIN
  -- Get user's current plan
  SELECT COALESCE(us.plan, 'free'), COALESCE(us.is_founding_member, false)
  INTO user_plan, is_founder
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  IF user_plan IS NULL THEN
    user_plan := 'free';
    is_founder := false;
  END IF;
  
  multiplier := CASE WHEN is_founder THEN 1.2 ELSE 1.0 END;
  
  SELECT jsonb_build_object(
    'plan', sp.name,
    'display_name', sp.display_name,
    'is_founding_member', is_founder,
    'profile_views_limit', CASE WHEN sp.profile_views_limit IS NULL THEN NULL ELSE FLOOR(sp.profile_views_limit * multiplier)::integer END,
    'daily_swipes_limit', CASE WHEN sp.daily_swipes_limit IS NULL THEN NULL ELSE FLOOR(sp.daily_swipes_limit * multiplier)::integer END,
    'active_matches_limit', CASE WHEN sp.active_matches_limit IS NULL THEN NULL ELSE FLOOR(sp.active_matches_limit * multiplier)::integer END,
    'messages_per_match_limit', CASE WHEN sp.messages_per_match_limit IS NULL THEN NULL ELSE FLOOR(sp.messages_per_match_limit * multiplier)::integer END,
    'can_send_voice', sp.can_send_voice,
    'can_send_video', sp.can_send_video,
    'can_send_images', sp.can_send_images,
    'images_per_chat_per_day', CASE WHEN sp.images_per_chat_per_day IS NULL THEN NULL ELSE FLOOR(sp.images_per_chat_per_day * multiplier)::integer END,
    'videos_per_chat_per_day', CASE WHEN sp.videos_per_chat_per_day IS NULL THEN NULL ELSE FLOOR(sp.videos_per_chat_per_day * multiplier)::integer END,
    'video_max_duration_seconds', sp.video_max_duration_seconds,
    'audio_messages_per_day', CASE WHEN sp.audio_messages_per_day IS NULL THEN NULL ELSE FLOOR(sp.audio_messages_per_day * multiplier)::integer END,
    'who_liked_you_limit', CASE WHEN sp.who_liked_you_limit IS NULL THEN NULL ELSE FLOOR(sp.who_liked_you_limit * multiplier)::integer END,
    'can_audio_call', sp.can_audio_call,
    'can_video_call', sp.can_video_call,
    'audio_calls_per_day', CASE WHEN sp.audio_calls_per_day IS NULL THEN NULL ELSE FLOOR(sp.audio_calls_per_day * multiplier)::integer END,
    'video_calls_per_day', CASE WHEN sp.video_calls_per_day IS NULL THEN NULL ELSE FLOOR(sp.video_calls_per_day * multiplier)::integer END,
    'call_duration_limit_minutes', sp.call_duration_limit_minutes
  )
  INTO plan_limits
  FROM public.subscription_plans sp
  WHERE sp.name = user_plan;
  
  RETURN plan_limits;
END;
$function$;