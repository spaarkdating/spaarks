-- Create table for team member photos
CREATE TABLE public.team_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name TEXT NOT NULL,
  member_role TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Team photos are viewable by everyone" 
ON public.team_photos 
FOR SELECT 
USING (true);

-- Create policies for admin write access
CREATE POLICY "Admins can insert team photos" 
ON public.team_photos 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update team photos" 
ON public.team_photos 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete team photos" 
ON public.team_photos 
FOR DELETE 
USING (is_admin());

-- Create storage bucket for team photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Team photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'team-photos');

CREATE POLICY "Admins can upload team photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'team-photos' AND (SELECT is_admin()));

CREATE POLICY "Admins can update team photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'team-photos' AND (SELECT is_admin()));

CREATE POLICY "Admins can delete team photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'team-photos' AND (SELECT is_admin()));