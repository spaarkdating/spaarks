-- Create payment_settings table to store admin-configurable payment details
CREATE TABLE public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upi_id TEXT,
  upi_qr_url TEXT,
  bank_name TEXT,
  account_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.admin_users(user_id)
);

-- Insert default row (singleton pattern)
INSERT INTO public.payment_settings (id, upi_id, bank_name, account_name, account_number, ifsc_code)
VALUES ('00000000-0000-0000-0000-000000000001', '7054533509@slc', 'Slice', 'Mandhata Singh', '033325229664052', 'NESF0000333');

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read payment settings (needed for checkout page)
CREATE POLICY "Anyone can view payment settings"
ON public.payment_settings
FOR SELECT
USING (true);

-- Only super admins can update payment settings
CREATE POLICY "Super admins can update payment settings"
ON public.payment_settings
FOR UPDATE
USING (is_super_admin());

-- Create storage bucket policy for UPI QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('upi-qr-codes', 'upi-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for UPI QR codes
CREATE POLICY "Anyone can view UPI QR codes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'upi-qr-codes');

CREATE POLICY "Admins can upload UPI QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'upi-qr-codes' AND is_admin());

CREATE POLICY "Admins can update UPI QR codes"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'upi-qr-codes' AND is_admin());

CREATE POLICY "Admins can delete UPI QR codes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'upi-qr-codes' AND is_admin());