-- Update get_public_stats to count active users by account_status (same as admin analytics)
CREATE OR REPLACE FUNCTION public.get_public_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_users_count INTEGER;
  unique_matches_count INTEGER;
  avg_rating_value NUMERIC;
  total_testimonials_count INTEGER;
BEGIN
  -- Get active users (account_status = 'active') - matches admin analytics
  SELECT COUNT(*)
  INTO active_users_count
  FROM public.profiles
  WHERE account_status = 'active';

  -- Get unique matches count
  -- Since each match creates two rows, count distinct pairs
  SELECT COUNT(DISTINCT 
    CASE 
      WHEN user_id < liked_user_id THEN user_id || '-' || liked_user_id
      ELSE liked_user_id || '-' || user_id
    END
  )
  INTO unique_matches_count
  FROM public.matches
  WHERE is_match = true;

  -- Get average rating from approved testimonials
  SELECT COALESCE(AVG(rating), 0)
  INTO avg_rating_value
  FROM public.testimonials
  WHERE status = 'approved';

  -- Get total approved testimonials count
  SELECT COUNT(*)
  INTO total_testimonials_count
  FROM public.testimonials
  WHERE status = 'approved';

  -- Return as JSON
  RETURN jsonb_build_object(
    'activeUsers', active_users_count,
    'totalMatches', unique_matches_count,
    'avgRating', ROUND(avg_rating_value, 1),
    'totalTestimonials', total_testimonials_count
  );
END;
$function$;