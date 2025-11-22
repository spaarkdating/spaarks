import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Settings as SettingsIcon, LogOut, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileEdit } from "@/components/profile/ProfileEdit";
import ProfileCompletion from "@/components/profile/ProfileCompletion";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setEmailVerified(!!user.email_confirmed_at);
      fetchProfile(user.id);
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("user_id", userId)
        .order("display_order");

      const { data: interestsData } = await supabase
        .from("user_interests")
        .select("interest:interests(*)")
        .eq("user_id", userId);

      if (profileData) setProfile(profileData);
      if (photosData) setPhotos(photosData);
      if (interestsData) setInterests(interestsData.map((ui: any) => ui.interest));
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user || isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Profile
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {isEditing ? (
          <ProfileEdit
            profile={profile}
            photos={photos}
            interests={interests}
            userId={user.id}
            onSave={() => {
              setIsEditing(false);
              fetchProfile(user.id);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-6">
            <ProfileCompletion 
              profile={profile} 
              photos={photos} 
              interests={interests}
            />
            <ProfileView
              profile={profile}
              photos={photos}
              interests={interests}
              emailVerified={emailVerified}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
