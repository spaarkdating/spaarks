-- Add swipe action type to matches to distinguish likes vs passes
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS action text;

-- Backfill existing rows: assume only confirmed matches were likes; others treated as passes
UPDATE public.matches
SET action = CASE WHEN is_match = true THEN 'like' ELSE 'pass' END
WHERE action IS NULL;

-- Enforce not null + allowed values
ALTER TABLE public.matches
ALTER COLUMN action SET NOT NULL;

ALTER TABLE public.matches
ADD CONSTRAINT matches_action_check CHECK (action IN ('like','pass','super'));

-- Index to speed up mutual match checks
CREATE INDEX IF NOT EXISTS idx_matches_pair_action ON public.matches (user_id, liked_user_id, action);
