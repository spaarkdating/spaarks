import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ProfileViews = () => {
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);
      await fetchProfileViews(user.id);
    };

    init();
  }, [navigate]);

  const fetchProfileViews = async (currentUserId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profile_views")
        .select(`
          *,
          viewer:profiles!profile_views_viewer_id_fkey(
            id,
            display_name,
            bio,
            photos(photo_url, display_order)
          )
        `)
        .eq("viewed_profile_id", currentUserId)
        .order("viewed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setViews(data || []);
    } catch (error) {
      console.error("Error fetching profile views:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstPhoto = (photos: any[]) => {
    if (!photos || photos.length === 0) return null;
    const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);
    return sorted[0]?.photo_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile views...</p>
      </div>
    );
  }

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
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" />
                Who Viewed My Profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {views.length} {views.length === 1 ? 'person has' : 'people have'} viewed your profile
              </p>
            </CardHeader>
            <CardContent>
              {views.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No profile views yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Keep swiping and engaging - your profile views will appear here!
                  </p>
                  <Link to="/dashboard">
                    <Button className="bg-gradient-to-r from-primary to-secondary">
                      Start Swiping
                    </Button>
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