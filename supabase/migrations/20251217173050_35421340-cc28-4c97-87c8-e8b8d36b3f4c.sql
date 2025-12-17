-- Fix notifications type constraint to allow profile view notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'match'::text,
        'message'::text,
        'like'::text,
        'system'::text,
        'profile_view'::text
      ]
    )
  );
