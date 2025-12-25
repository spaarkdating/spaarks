-- Fix RLS policies for user_subscriptions to allow admins to manage subscriptions
DROP POLICY IF EXISTS "System can insert subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "System can update subscriptions" ON user_subscriptions;

-- Allow admins to insert subscriptions
CREATE POLICY "Admins can insert subscriptions" ON user_subscriptions
FOR INSERT WITH CHECK (is_admin());

-- Allow admins to update subscriptions  
CREATE POLICY "Admins can update subscriptions" ON user_subscriptions
FOR UPDATE USING (is_admin());

-- Update payment-proofs storage bucket to be public so admins can view payment screenshots
UPDATE storage.buckets SET public = true WHERE id = 'payment-proofs';

-- Update storage policies to allow admin access to view all payment proofs
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs' AND is_admin());

-- Allow anyone to view payment proofs (since bucket is now public)
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;
CREATE POLICY "Anyone can view payment proofs" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');