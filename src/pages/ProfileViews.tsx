import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, User, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ProfileViews = () => {
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewProfileViews, limits } = useSubscription();
  const isFetchingRef = useRef(false);
  const channelRef = useRef<any>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const profileViewsAccess = useMemo(() => canViewProfileViews(), [canViewProfileViews, limits]);

  const fetchProfileViews = useCallback(async (currentUserId: string, isInitialLoad = false, skipDebounce = false) => {
    const now = Date.now();
    // Only debounce for manual refreshes, not for real-time updates or auto-refreshes
    if (!skipDebounce && isFetchingRef.current && (now - lastFetchTimeRef.current < 1000)) {
      console.log('⏸️ Skipping fetch - too soon since last fetch');
      return;
    }

    // Force refresh if skipDebounce is true (for auto-refreshes) - bypass fetch lock
    if (skipDebounce && isFetchingRef.current) {
      console.log('🔄 Force refresh - bypassing fetch lock');
      // Reset the lock to allow the fetch to proceed
      isFetchingRef.current = false;
    }

    console.log(`🔄 Fetching profile views (initial: ${isInitialLoad}, skipDebounce: ${skipDebounce})`);
    lastFetchTimeRef.current = now;
    isFetchingRef.current = true;
    
    // Only show loading spinner on initial load, never on refreshes
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const access = canViewProfileViews();
      if (!access.canView) {
        // Only clear views on initial load if access is denied
        // During refresh, keep existing views even if access check fails temporarily
        if (isInitialLoad) {
          setViews([]);
          setLoading(false);
        }
        isFetchingRef.current = false;
        return;
      }

      const fetchLimit = access.limit ?? 50;

      // First, fetch the profile views
      const { data: profileViews, error: viewsError } = await supabase
        .from("profile_views")
        .select("*")
        .eq("viewed_profile_id", currentUserId)
        .order("viewed_at", { ascending: false })
        .limit(fetchLimit);

      if (viewsError) throw viewsError;

      // Only clear views if we're on initial load and there are no views
      // During refresh, only update if we have data
      if (!profileViews || profileViews.length === 0) {
        if (isInitialLoad) {
          setViews([]);
          setLoading(false);
        }
        // Don't clear existing views on refresh if fetch returns empty
        isFetchingRef.current = false;
        return;
      }

      // Get unique viewer IDs
      const viewerIds = [...new Set(profileViews.map((pv: any) => pv.viewer_id))];

      // Fetch viewer profiles
      const { data: viewerProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          display_name,
          bio
        `)
        .in("id", viewerIds);

      if (profilesError) throw profilesError;

      // Fetch photos for all viewers
      const { data: allPhotos, error: photosError } = await supabase
        .from("photos")
        .select("user_id, photo_url, display_order")
        .in("user_id", viewerIds)
        .order("display_order", { ascending: true });

      if (photosError) throw photosError;

      // Create a map of viewer profiles with their photos
      const viewerMap = new Map();
      viewerProfiles?.forEach((profile: any) => {
        const profilePhotos = allPhotos?.filter((p: any) => p.user_id === profile.id) || [];
        viewerMap.set(profile.id, {
          ...profile,
          photos: profilePhotos,
        });
      });

      // Combine profile views with viewer data
      const viewsWithViewers = profileViews.map((view: any) => ({
        ...view,
        viewer: viewerMap.get(view.viewer_id) || null,
      }));

      // Always update views with new data - never clear unless initial load with no data
      setViews(viewsWithViewers);
    } catch (error: any) {
      console.error("Error fetching profile views:", error);
      // Only show error and clear views on initial load
      // During refresh, keep existing views even if fetch fails
      if (isInitialLoad) {
        toast({
          title: "Error loading profile views",
          description: error.message || "Failed to load profile views. Please try again.",
          variant: "destructive",
        });
        setViews([]);
        setLoading(false);
      }
      // Don't clear views on error during refresh - keep existing data
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, [canViewProfileViews, toast]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);
      
      // Initial load
      setLoading(true);
      fetchProfileViews(user.id, true).then(() => {
        setLoading(false);
      });
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Automatic refresh after 2 seconds (simulates clicking refresh button)
  useEffect(() => {
    if (!userId) return;

    const autoRefreshTimer = setTimeout(() => {
      console.log('🔄 Auto-clicking refresh button after 2 seconds');
      // Programmatically trigger the same refresh as the button click
      if (!isFetchingRef.current) {
        fetchProfileViews(userId, false, false); // Same as onClick refresh button
      }
    }, 2000);

    return () => {
      clearTimeout(autoRefreshTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Real-time updates for new profile views
  useEffect(() => {
    if (!userId) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Real-time subscription - immediate refresh on new view (skip debounce for real-time)
    const viewsChannel = supabase
      .channel(`profile-views-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_views',
          filter: `viewed_profile_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Real-time: New profile view detected!', payload);
          // Refresh immediately without debounce
          fetchProfileViews(userId, false, true);
        }
      )
      .subscribe((status) => {
        console.log('📡 Profile views subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription ACTIVE - updates will appear automatically');
          // Automatic refresh once subscription is active to ensure data is loaded
          setTimeout(() => {
            if (userId) {
              console.log('🔄 Auto-refresh after subscription active (forcing)');
              isFetchingRef.current = false;
              fetchProfileViews(userId, false, true);
            }
          }, 800);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
          // If subscription fails, do an immediate refresh
          if (userId) {
            setTimeout(() => {
              console.log('🔄 Auto-refresh after subscription error (forcing)');
              isFetchingRef.current = false;
              fetchProfileViews(userId, false, true);
            }, 1000);
          }
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Real-time subscription timed out - using polling fallback');
        } else if (status === 'CLOSED') {
          console.warn('🔒 Real-time subscription closed - reconnecting...');
        }
      });

    channelRef.current = viewsChannel;

    // Polling fallback: Every 3 seconds (ensures updates even if real-time fails)
    const pollInterval = setInterval(() => {
      if (userId) {
        console.log('🔄 Polling refresh (forcing)');
        // Force refresh by resetting the fetch lock
        isFetchingRef.current = false;
        fetchProfileViews(userId, false, true); // Use skipDebounce for polling too
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const getFirstPhoto = (photos: any[]) => {
    if (!photos || photos.length === 0) return null;
    const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
    return sorted[0]?.photo_url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <Card className="shadow-xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-6 w-6 text-primary" />
                    Who Viewed My Profile
                    {loading && (
                      <span className="ml-2 text-xs text-muted-foreground">(Loading...)</span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {profileViewsAccess.canView
                      ? `${views.length} ${views.length === 1 ? "person has" : "people have"} viewed your profile${isRefreshing ? ' (updating...)' : ''}`
                      : "Upgrade to see who viewed your profile"}
                  </p>
                </div>
                {profileViewsAccess.canView && userId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchProfileViews(userId, false, false)}
                    disabled={isFetchingRef.current}
                  >
                    {isFetchingRef.current ? 'Refreshing...' : 'Refresh'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
                {!profileViewsAccess.canView ? (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Available on Plus & above</h3>
                    <p className="text-muted-foreground mb-6">
                      Upgrade your plan to see who viewed your profile.
                    </p>
                    <Button onClick={() => navigate("/pricing")} className="bg-gradient-to-r from-primary to-secondary">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </div>
                ) : views.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No profile views yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Keep swiping and engaging - your profile views will appear here!
                    </p>
                    <Link to="/dashboard">
                      <Button className="bg-gradient-to-r from-primary to-secondary">Start Swiping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {views.map((view) => {
                      const photo = getFirstPhoto(view.viewer?.photos || []);
                      return (
                        <Card
                          key={view.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => navigate(`/profile/${view.viewer?.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={photo || undefined} alt={view.viewer?.display_name} />
                                <AvatarFallback>
                                  <User className="h-8 w-8" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {view.viewer?.display_name || "Unknown User"}
                                </h3>
                                {view.viewer?.bio && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {view.viewer.bio}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Viewed {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                                </p>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileViews;