-- Create a table for guest contact inquiries (public submissions without login)
CREATE TABLE public.contact_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_reply TEXT,
  replied_by UUID REFERENCES public.admin_users(user_id),
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a contact inquiry (public form)
CREATE POLICY "Anyone can submit contact inquiries" 
ON public.contact_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Support staff can view all inquiries
CREATE POLICY "Support staff can view all inquiries" 
ON public.contact_inquiries 
FOR SELECT 
USING (is_support());

-- Support staff can update inquiries
CREATE POLICY "Support staff can update inquiries" 
ON public.contact_inquiries 
FOR UPDATE 
USING (is_support());