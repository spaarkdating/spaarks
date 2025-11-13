import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Heart } from "lucide-react";
import { format } from "date-fns";

interface ProfileViewProps {
  profile: any;
  photos: any[];
  interests: any[];
}

export const ProfileView = ({ profile, photos, interests }: ProfileViewProps) => {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Photos Grid */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative aspect-square group">
                <img
                  src={photo.photo_url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold mb-1">
                {profile.display_name}
                {age && <span className="text-muted-foreground">, {age}</span>}
              </h2>
              <p className="text-muted-foreground capitalize">{profile.gender}</p>
            </div>

            {profile.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}

            {profile.date_of_birth && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(profile.date_of_birth), "MMMM d, yyyy")}</span>
              </div>
            )}

            {profile.looking_for && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>Looking for {profile.looking_for}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-3">About Me</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge key={interest.id} variant="secondary" className="text-sm">
                  {interest.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
