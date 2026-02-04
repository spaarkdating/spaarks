-- Add who_liked_you_limit column to subscription_plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS who_liked_you_limit integer DEFAULT 0;

-- Update existing plans with who_liked_you_limit values
-- Free: 0 (cannot see), Plus: 3, Pro: 10, Elite: null (unlimited)
UPDATE public.subscription_plans SET who_liked_you_limit = 0 WHERE name = 'free';
UPDATE public.subscription_plans SET who_liked_you_limit = 3 WHERE name = 'plus';
UPDATE public.subscription_plans SET who_liked_you_limit = 10 WHERE name = 'pro';
UPDATE public.subscription_plans SET who_liked_you_limit = NULL WHERE name = 'elite';

-- Update the get_user_plan_limits function to include who_liked_you_limit
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
    'who_liked_you_limit', CASE WHEN sp.who_liked_you_limit IS NULL THEN NULL ELSE FLOOR(sp.who_liked_you_limit * multiplier)::integer END
  )
  INTO plan_limits
  FROM public.subscription_plans sp
  WHERE sp.name = user_plan;
  
  RETURN plan_limits;
END;
$function$;