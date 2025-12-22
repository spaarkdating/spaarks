-- Create blocked_emails table to store emails that have been permanently deleted
CREATE TABLE IF NOT EXISTS public.blocked_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  user_display_name text,
  reason text DEFAULT 'User requested permanent deletion'
);

-- Enable RLS on blocked_emails
ALTER TABLE public.blocked_emails ENABLE ROW LEVEL SECURITY;

-- Only allow the system (via service role) to insert blocked emails
-- No one can view, update, or delete blocked emails from client
CREATE POLICY "Only service role can manage blocked emails"
ON public.blocked_emails
FOR ALL
USING (false)
WITH CHECK (false);

-- Create a function to check if an email is blocked
CREATE OR REPLACE FUNCTION public.is_email_blocked(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_emails WHERE LOWER(email) = LOWER(check_email)
  )
$$;