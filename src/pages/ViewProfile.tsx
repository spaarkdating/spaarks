import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfileView } from "@/components/profile/ProfileView";
import { PhotoCarousel } from "@/components/profile/PhotoCarousel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import ReportProfileDialog from "@/components/profile/ReportProfileDialog";
import { recordProfileView } from "@/lib/profileViews";

const ViewProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [showPhotoCarousel, setShowPhotoCarousel] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
      
      if (id) {
        await fetchProfile(id);
        await checkMatch(user.id, id);
        // Record profile view - this is the main trigger when someone views a profile
        await recordProfileView(user.id, id);
      }
    };

    init();
  }, [id, navigate]);

  const fetchProfile = async (profileId: string) => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error("Profile not found");
        navigate("/dashboard");
        return;
      }

      setProfile(profileData);

      // Fetch photos
      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", profileId)
        .order("display_order", { ascending: true });

      setPhotos(photosData || []);

      // Fetch interests
      const { data: interestsData } = await supabase
        .from("user_interests")
        .select("interest:interests(*)")
        .eq("user_id", profileId);

      const formattedInterests = interestsData?.map((item: any) => item.interest) || [];
      setInterests(formattedInterests);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkMatch = async (userId: string, profileId: string) => {
    try {
      const { data } = await supabase.rpc("are_users_matched", {
        _user1_id: userId,
        _user2_id: profileId,
      });
      setIsMatched(data || false);
    } catch (error) {
      console.error("Error checking match:", error);
    }
  };


  const handleMessage = () => {
    navigate("/messages", { state: { selectedUserId: id } });
  };

  const handleLike = async () => {
    if (!currentUserId || !id) return;

    try {
      const { error } = await (supabase as any).from("matches").insert({
        user_id: currentUserId,
        liked_user_id: id,
        is_match: false,
        action: "like",
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already liked this profile");
        } else {
          throw error;
        }
      } else {
        toast.success("Profile liked!");
      }
    } catch (error) {
      console.error("Error liking profile:", error);
      toast.error("Failed to like profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <ReportProfileDialog
            reportedUserId={id || ""}
            reportedUserName={profile?.display_name || "Unknown"}
          />
        </div>

        <ProfileView
          profile={profile}
          photos={photos}
          interests={interests}
          emailVerified={profile.verification_status === "approved"}
          onPhotoClick={(index) => {
            setCarouselStartIndex(index);
            setShowPhotoCarousel(true);
          }}
        />

        {/* Action Buttons */}
        {currentUserId !== id && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom z-50">
            <div className="container mx-auto max-w-2xl flex gap-3">
              {isMatched ? (
                <Button
                  onClick={handleMessage}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message
                </Button>
              ) : (
                <Button
                  onClick={handleLike}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Like
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Photo Carousel Dialog */}
      <Dialog open={showPhotoCarousel} onOpenChange={setShowPhotoCarousel}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl h-[80vh] max-h-[80vh] p-0 bg-background/95 overflow-hidden">
          <PhotoCarousel
            photos={photos}
            initialIndex={carouselStartIndex}
            onClose={() => setShowPhotoCarousel(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewProfile;
