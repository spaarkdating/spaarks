-- Enable realtime for profile_views table (required for postgres_changes to work)
ALTER TABLE public.profile_views REPLICA IDENTITY FULL;

-- Update the trigger function to use generic message (no viewer name)
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create notification with generic message - don't reveal who viewed
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

