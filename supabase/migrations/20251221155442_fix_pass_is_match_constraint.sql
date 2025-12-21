-- Fix the issue where pass actions can have is_match = true
-- This should never happen - a pass should always have is_match = false

-- First, drop the constraint if it exists (in case we're re-running this migration)
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_pass_no_match_check;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_pass_no_match_trigger ON public.matches;

-- Fix any existing incorrect records FIRST
-- This must be done before adding the constraint
UPDATE matches 
SET is_match = false 
WHERE action = 'pass' AND is_match = true;

-- Verify no violating rows exist (this will fail if there are still issues)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM matches 
    WHERE action = 'pass' AND is_match = true
  ) THEN
    RAISE EXCEPTION 'Still have pass actions with is_match = true after update. Please check manually.';
  END IF;
END $$;

-- Now add the check constraint to prevent this from happening in the future
ALTER TABLE public.matches
ADD CONSTRAINT matches_pass_no_match_check 
CHECK (
  (action = 'pass' AND is_match = false) OR 
  (action IN ('like', 'super'))
);

-- Create a trigger function to automatically set is_match = false when action = 'pass'
CREATE OR REPLACE FUNCTION public.ensure_pass_no_match()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If action is 'pass', force is_match to be false
  IF NEW.action = 'pass' THEN
    NEW.is_match := false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS ensure_pass_no_match_trigger ON public.matches;

-- Create trigger to enforce the constraint
CREATE TRIGGER ensure_pass_no_match_trigger
  BEFORE INSERT OR UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_pass_no_match();

