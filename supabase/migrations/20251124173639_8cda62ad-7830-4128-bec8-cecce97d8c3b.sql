-- Create testimonials table for user reviews
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  story TEXT NOT NULL,
  match_duration TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  CONSTRAINT testimonials_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT testimonials_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT testimonials_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES admin_users(user_id) ON DELETE SET NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Users can create their own testimonials
CREATE POLICY "Users can create own testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own testimonials
CREATE POLICY "Users can view own testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() = user_id);

-- Everyone can view approved testimonials
CREATE POLICY "Anyone can view approved testimonials"
ON public.testimonials
FOR SELECT
USING (status = 'approved');

-- Admins can view all testimonials
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials
FOR SELECT
USING (is_admin());

-- Admins can update testimonials (for approval/rejection)
CREATE POLICY "Admins can update testimonials"
ON public.testimonials
FOR UPDATE
USING (is_admin());

-- Create index for faster queries
CREATE INDEX idx_testimonials_status ON public.testimonials(status);
CREATE INDEX idx_testimonials_created_at ON public.testimonials(created_at DESC);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;