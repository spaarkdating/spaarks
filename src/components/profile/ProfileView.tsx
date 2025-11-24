import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Heart, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ProfileViewProps {
  profile: any;
  photos: any[];
  interests: any[];
  emailVerified?: boolean;
}

export const ProfileView = ({ profile, photos, interests, emailVerified = false }: ProfileViewProps) => {
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
              <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                <span>
                  {profile.display_name}
                  {age && <span className="text-muted-foreground">, {age}</span>}
                </span>
                {emailVerified && (
                  <CheckCircle className="h-6 w-6 text-primary fill-primary" />
                )}
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

      {/* Additional Info */}
      {(profile.height || profile.occupation || profile.education || profile.relationship_goal || profile.smoking || profile.drinking || profile.religion) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {profile.height && (
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">{profile.height}</p>
                </div>
              )}
              {profile.occupation && (
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="font-medium">{profile.occupation}</p>
                </div>
              )}
              {profile.education && (
                <div>
                  <p className="text-sm text-muted-foreground">Education</p>
                  <p className="font-medium capitalize">{profile.education.replace(/-/g, ' ')}</p>
                </div>
              )}
              {profile.relationship_goal && (
                <div>
                  <p className="text-sm text-muted-foreground">Looking For</p>
                  <p className="font-medium capitalize">{profile.relationship_goal.replace(/-/g, ' ')}</p>
                </div>
              )}
              {profile.smoking && (
                <div>
                  <p className="text-sm text-muted-foreground">Smoking</p>
                  <p className="font-medium capitalize">{profile.smoking}</p>
                </div>
              )}
              {profile.drinking && (
                <div>
                  <p className="text-sm text-muted-foreground">Drinking</p>
                  <p className="font-medium capitalize">{profile.drinking}</p>
                </div>
              )}
              {profile.religion && (
                <div>
                  <p className="text-sm text-muted-foreground">Religion</p>
                  <p className="font-medium capitalize">{profile.religion}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
