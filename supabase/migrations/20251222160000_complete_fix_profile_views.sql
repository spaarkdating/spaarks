-- COMPLETE FIX FOR PROFILE VIEWS NOTIFICATIONS AND REALTIME

-- Step 1: Enable realtime for profile_views table (REQUIRED)
ALTER TABLE public.profile_views REPLICA IDENTITY FULL;

-- Step 2: Update ALL existing notifications to be generic
UPDATE public.notifications
SET 
  title = 'Profile View',
  message = 'Someone viewed your profile'
WHERE type = 'profile_view' 
  AND message LIKE '% viewed your profile'
  AND message != 'Someone viewed your profile';

-- Step 3: Drop and recreate the trigger function
DROP TRIGGER IF EXISTS on_profile_view ON public.profile_views;
DROP FUNCTION IF EXISTS public.notify_profile_view() CASCADE;

-- Step 4: Create new trigger function with generic message ONLY
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ALWAYS use generic message - NEVER show viewer name
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.viewed_profile_id,
    'profile_view',
    'Profile View',
    'Someone viewed your profile',
    jsonb_build_object('viewer_id', NEW.viewer_id, 'view_id', NEW.id)
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_profile_view
  AFTER INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_view();

-- Verify the function
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'notify_profile_view';

