-- Set immutable search_path for functions flagged by linter

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.has_active_boost(user_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.boost_purchases
    WHERE user_id = user_profile_id
      AND status = 'active'
      AND expires_at > now()
  );
$$;
