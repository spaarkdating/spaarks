-- Create trigger to send notification when someone views your profile
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  viewer_name text;
BEGIN
  -- Get the viewer's display name
  SELECT display_name INTO viewer_name
  FROM public.profiles
  WHERE id = NEW.viewer_id;
  
  -- Create notification for the viewed user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.viewed_profile_id,
    'profile_view',
    'New Profile View',
    viewer_name || ' viewed your profile',
    jsonb_build_object('viewer_id', NEW.viewer_id, 'view_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on profile_views table
DROP TRIGGER IF EXISTS on_profile_view ON public.profile_views;
CREATE TRIGGER on_profile_view
  AFTER INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_profile_view();

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Enable realtime for matches table (if not already enabled)
ALTER TABLE public.matches REPLICA IDENTITY FULL;

-- Enable realtime for messages table (if not already enabled)
ALTER TABLE public.messages REPLICA IDENTITY FULL;