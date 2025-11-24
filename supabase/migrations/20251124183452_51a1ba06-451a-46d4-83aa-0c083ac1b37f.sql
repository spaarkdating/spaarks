-- Add media columns to testimonials table
ALTER TABLE public.testimonials 
ADD COLUMN photo_url TEXT,
ADD COLUMN video_url TEXT;

-- Update storage policies for testimonial media
CREATE POLICY "Testimonial media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'testimonials');

CREATE POLICY "Users can upload testimonial media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their testimonial media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their testimonial media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'testimonials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create testimonials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;