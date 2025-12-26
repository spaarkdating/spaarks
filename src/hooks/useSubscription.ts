import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlanLimits {
  plan: string;
  display_name: string;
  is_founding_member: boolean;
  profile_views_limit: number | null;
  daily_swipes_limit: number | null;
  active_matches_limit: number | null;
  messages_per_match_limit: number | null;
  can_send_voice: boolean;
  can_send_video: boolean;
  can_send_images: boolean;
  images_per_chat_per_day: number | null;
  videos_per_chat_per_day: number | null;
  video_max_duration_seconds: number | null;
  audio_messages_per_day: number | null;
}

export interface SubscriptionData {
  plan: string;
  status: string;
  expires_at: string | null;
  is_founding_member: boolean;
  cancelled_at: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get subscription
      const { data: subData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subData) {
        setSubscription({
          plan: subData.plan,
          status: subData.status,
          expires_at: subData.expires_at,
          is_founding_member: subData.is_founding_member || false,
          cancelled_at: subData.cancelled_at,
        });
      } else {
        // Default to free plan
        setSubscription({
          plan: 'free',
          status: 'active',
          expires_at: null,
          is_founding_member: false,
          cancelled_at: null,
        });
      }

      // Get limits
      const { data: limitsData } = await supabase.rpc('get_user_plan_limits', {
        p_user_id: user.id,
      });

      if (limitsData && typeof limitsData === 'object') {
        setLimits(limitsData as unknown as PlanLimits);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSwipeLimit = async (): Promise<boolean> => {
    if (!limits?.daily_swipes_limit) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('swipes_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentSwipes = usage?.swipes_count || 0;
    return currentSwipes < limits.daily_swipes_limit;
  };

  const incrementSwipeCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Upsert usage record
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id, swipes_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existing) {
      await supabase
        .from('usage_tracking')
        .update({ swipes_count: (existing.swipes_count || 0) + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({ user_id: user.id, date: today, swipes_count: 1 });
    }
  };

  const checkActiveMatchesLimit = async (): Promise<boolean> => {
    if (!limits?.active_matches_limit) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_match', true);

    return (count || 0) < limits.active_matches_limit;
  };

  const checkMessageLimit = async (matchId: string): Promise<boolean> => {
    if (!limits?.messages_per_match_limit) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get the other user in the match
    const { data: match } = await supabase
      .from('matches')
      .select('user_id, liked_user_id')
      .eq('id', matchId)
      .single();

    if (!match) return false;

    const otherUserId = match.user_id === user.id ? match.liked_user_id : match.user_id;

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', otherUserId);

    return (count || 0) < limits.messages_per_match_limit;
  };

  const checkImageLimit = async (chatPartnerId: string): Promise<boolean> => {
    if (!limits?.can_send_images) return false;
    if (!limits?.images_per_chat_per_day) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('images_sent')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const imagesSent = (usage?.images_sent as Record<string, number>) || {};
    const chatImages = imagesSent[chatPartnerId] || 0;

    return chatImages < limits.images_per_chat_per_day;
  };

  const checkVideoLimit = async (chatPartnerId: string): Promise<boolean> => {
    if (!limits?.can_send_video) return false;
    if (!limits?.videos_per_chat_per_day) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('videos_sent')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const videosSent = (usage?.videos_sent as Record<string, number>) || {};
    const chatVideos = videosSent[chatPartnerId] || 0;

    return chatVideos < limits.videos_per_chat_per_day;
  };

  const checkAudioLimit = async (): Promise<boolean> => {
    if (!limits?.can_send_voice) return false;
    if (!limits?.audio_messages_per_day) return true; // unlimited

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('audio_messages_sent')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    return (usage?.audio_messages_sent || 0) < limits.audio_messages_per_day;
  };

  const canViewProfileViews = (): { canView: boolean; limit: number | null } => {
    if (!limits) return { canView: false, limit: 0 };
    return {
      canView: (limits.profile_views_limit || 0) > 0,
      limit: limits.profile_views_limit,
    };
  };

  return {
    subscription,
    limits,
    loading,
    checkSwipeLimit,
    incrementSwipeCount,
    checkActiveMatchesLimit,
    checkMessageLimit,
    checkImageLimit,
    checkVideoLimit,
    checkAudioLimit,
    canViewProfileViews,
    refetch: fetchSubscription,
  };
}
