-- Allow anyone to count founding members (for pricing page "spots left")
CREATE POLICY "Anyone can count founding members"
ON public.founding_members
FOR SELECT
USING (true);