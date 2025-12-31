-- Allow super admins to update subscription plans
CREATE POLICY "Super admins can update subscription plans" 
ON public.subscription_plans 
FOR UPDATE 
USING (is_super_admin())
WITH CHECK (is_super_admin());