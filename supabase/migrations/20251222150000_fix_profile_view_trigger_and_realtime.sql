-- Step 1: Enable realtime for profile_views table (REQUIRED for postgres_changes to work)
ALTER TABLE public.profile_views REPLICA IDENTITY FULL;

-- Step 2: Drop the old trigger function and recreate it with generic message
DROP TRIGGER IF EXISTS on_profile_view ON public.profile_views;
DROP FUNCTION IF EXISTS public.notify_profile_view();

-- Step 3: Create new trigger function with generic message (NO viewer name)
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create notification with generic message - NEVER reveal who viewed
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

-- Step 4: Recreate the trigger
CREATE TRIGGER on_profile_view
  AFTER INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_view();

