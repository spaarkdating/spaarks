-- Add policy to allow anyone to check if their email exists for unsubscribe
CREATE POLICY "Anyone can check their subscription status"
ON public.newsletter_subscriptions
FOR SELECT
USING (true);