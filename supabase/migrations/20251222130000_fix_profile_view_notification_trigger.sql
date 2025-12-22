-- Update the trigger function to use generic message instead of viewer name
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create notification for the viewed user with generic message
  -- Don't reveal who viewed the profile in the notification
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
  ON CONFLICT DO NOTHING; -- Prevent duplicate notifications
  
  RETURN NEW;
END;
$$;

-- The trigger already exists, so we don't need to recreate it
-- Just the function update above will fix the notification message

