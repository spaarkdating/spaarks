-- Add missing founding members for profiles that are already approved
-- but not in the founding_members table

-- Insert missing founding members
INSERT INTO public.founding_members (user_id, order_number)
SELECT 
  p.id,
  (SELECT COALESCE(MAX(order_number), 0) FROM public.founding_members) + ROW_NUMBER() OVER (ORDER BY p.created_at)
FROM public.profiles p
WHERE p.verification_status = 'approved'
  AND p.display_name IS NOT NULL
  AND p.date_of_birth IS NOT NULL
  AND p.gender IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.founding_members fm WHERE fm.user_id = p.id
  )
  AND (SELECT COUNT(*) FROM public.founding_members) < 100
ORDER BY p.created_at
LIMIT 100 - (SELECT COUNT(*) FROM public.founding_members);

-- Also update the trigger to fire on INSERT as well (for new users who complete their profile immediately)
DROP TRIGGER IF EXISTS on_profile_complete_founding_check ON public.profiles;

CREATE OR REPLACE FUNCTION public.trigger_founding_member_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if profile is complete (has required fields) and approved
  IF NEW.display_name IS NOT NULL 
     AND NEW.date_of_birth IS NOT NULL 
     AND NEW.gender IS NOT NULL 
     AND NEW.verification_status = 'approved' THEN
    PERFORM public.check_founding_member_eligibility(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on both INSERT and UPDATE
CREATE TRIGGER on_profile_complete_founding_check
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_founding_member_check();