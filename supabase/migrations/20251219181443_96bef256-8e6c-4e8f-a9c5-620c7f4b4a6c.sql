-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_plan TEXT CHECK (min_plan IN ('plus', 'pro', 'elite')),
  applicable_plans TEXT[] DEFAULT ARRAY['plus', 'pro', 'elite'],
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL,
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Coupons policies - anyone can read active coupons, only admins can manage
CREATE POLICY "Anyone can read active coupons"
  ON public.coupons
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  USING (public.is_admin());

-- Coupon usage policies
CREATE POLICY "Users can view their own coupon usage"
  ON public.coupon_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coupon usage"
  ON public.coupon_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_plan TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_already_used BOOLEAN;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon code');
  END IF;
  
  -- Check if plan is applicable
  IF v_coupon.applicable_plans IS NOT NULL AND NOT (p_plan = ANY(v_coupon.applicable_plans)) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not valid for the selected plan');
  END IF;
  
  -- Check if user already used this coupon
  SELECT EXISTS(
    SELECT 1 FROM public.coupon_usage 
    WHERE coupon_id = v_coupon.id AND user_id = p_user_id
  ) INTO v_already_used;
  
  IF v_already_used THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
  END IF;
  
  -- Return valid coupon info
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'description', v_coupon.description,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value
  );
END;
$$;