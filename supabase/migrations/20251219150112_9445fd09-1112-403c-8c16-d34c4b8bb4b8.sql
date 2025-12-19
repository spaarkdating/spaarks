-- Create subscription plan type enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'plus', 'pro', 'elite');

-- Subscription plans table with limits
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name subscription_plan UNIQUE NOT NULL,
  display_name text NOT NULL,
  price_inr integer NOT NULL DEFAULT 0,
  profile_views_limit integer, -- NULL = unlimited
  daily_swipes_limit integer, -- NULL = unlimited
  active_matches_limit integer, -- NULL = unlimited
  messages_per_match_limit integer, -- NULL = unlimited
  can_send_voice boolean DEFAULT false,
  can_send_video boolean DEFAULT false,
  can_send_images boolean DEFAULT false,
  images_per_chat_per_day integer DEFAULT 0,
  videos_per_chat_per_day integer DEFAULT 0,
  video_max_duration_seconds integer DEFAULT 0,
  audio_messages_per_day integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Insert plan data
INSERT INTO public.subscription_plans (name, display_name, price_inr, profile_views_limit, daily_swipes_limit, active_matches_limit, messages_per_match_limit, can_send_voice, can_send_video, can_send_images, images_per_chat_per_day, videos_per_chat_per_day, video_max_duration_seconds, audio_messages_per_day) VALUES
('free', 'Free', 0, 0, 10, 5, 10, false, false, false, 0, 0, 0, 0),
('plus', 'Plus', 149, 3, 30, 15, NULL, false, false, true, 1, 0, 0, 0),
('pro', 'Pro', 249, 10, NULL, NULL, NULL, true, false, true, 5, 1, 15, 2),
('elite', 'Elite', 399, NULL, NULL, NULL, NULL, true, true, true, NULL, NULL, 30, NULL);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  razorpay_subscription_id text,
  razorpay_payment_id text,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  is_founding_member boolean DEFAULT false,
  founding_member_price_locked integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Daily usage tracking
CREATE TABLE public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  swipes_count integer DEFAULT 0,
  images_sent jsonb DEFAULT '{}', -- {chat_id: count}
  videos_sent jsonb DEFAULT '{}',
  audio_messages_sent integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Founding members tracking
CREATE TABLE public.founding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT
USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (true);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage"
ON public.usage_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
ON public.usage_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
ON public.usage_tracking FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for founding_members
CREATE POLICY "Users can view own founding status"
ON public.founding_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert founding members"
ON public.founding_members FOR INSERT
WITH CHECK (true);

-- Function to get user's effective plan limits (with founding member bonus)
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    'audio_messages_per_day', CASE WHEN sp.audio_messages_per_day IS NULL THEN NULL ELSE FLOOR(sp.audio_messages_per_day * multiplier)::integer END
  )
  INTO plan_limits
  FROM public.subscription_plans sp
  WHERE sp.name = user_plan;
  
  RETURN plan_limits;
END;
$$;

-- Function to check and assign founding member status
CREATE OR REPLACE FUNCTION public.check_founding_member_eligibility(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  already_founder boolean;
BEGIN
  -- Check if already a founding member
  SELECT EXISTS(SELECT 1 FROM public.founding_members WHERE user_id = p_user_id)
  INTO already_founder;
  
  IF already_founder THEN
    RETURN true;
  END IF;
  
  -- Get current founding member count
  SELECT COUNT(*) INTO current_count FROM public.founding_members;
  
  -- If under 100, add as founding member
  IF current_count < 100 THEN
    INSERT INTO public.founding_members (user_id, order_number)
    VALUES (p_user_id, current_count + 1)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Trigger to check founding member eligibility on profile completion
CREATE OR REPLACE FUNCTION public.trigger_founding_member_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if profile is now complete (has required fields)
  IF NEW.display_name IS NOT NULL 
     AND NEW.date_of_birth IS NOT NULL 
     AND NEW.gender IS NOT NULL 
     AND NEW.verification_status = 'approved' THEN
    PERFORM public.check_founding_member_eligibility(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_complete_founding_check
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status AND NEW.verification_status = 'approved')
  EXECUTE FUNCTION public.trigger_founding_member_check();