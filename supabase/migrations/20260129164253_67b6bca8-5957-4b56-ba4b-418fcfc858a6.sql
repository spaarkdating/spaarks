-- Add payment_reference column to payment_requests for unique tracking
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE;

-- Add index for faster lookups by payment reference
CREATE INDEX IF NOT EXISTS idx_payment_requests_reference ON public.payment_requests(payment_reference);

-- Create bank_statement_uploads table to track uploaded statements
CREATE TABLE IF NOT EXISTS public.bank_statement_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  transactions_found INTEGER DEFAULT 0,
  payments_matched INTEGER DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bank_statement_uploads
ALTER TABLE public.bank_statement_uploads ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage bank statement uploads
CREATE POLICY "Super admins can manage bank statements" 
ON public.bank_statement_uploads 
FOR ALL 
USING (is_super_admin());

-- Create storage bucket for bank statements
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-statements', 'bank-statements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for bank statements (admin only)
CREATE POLICY "Super admins can upload bank statements"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bank-statements' AND is_super_admin());

CREATE POLICY "Super admins can view bank statements"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bank-statements' AND is_super_admin());

CREATE POLICY "Super admins can delete bank statements"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bank-statements' AND is_super_admin());