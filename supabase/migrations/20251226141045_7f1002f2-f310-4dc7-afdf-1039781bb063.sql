-- Add RLS policy for admins to view all user subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
FOR SELECT USING (is_admin());

-- Allow users to update their own subscription (for cancellation)
CREATE POLICY "Users can cancel own subscription" ON public.user_subscriptions
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);