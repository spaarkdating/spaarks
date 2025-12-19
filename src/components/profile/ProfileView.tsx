import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Heart, CheckCircle, Instagram, Twitter, Linkedin } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { FoundingMemberBadge } from "./FoundingMemberBadge";

interface ProfileViewProps {
  profile: any;
  photos: any[];
  interests: any[];
  emailVerified?: boolean;
  showPhotos?: boolean;
  onPhotoClick?: (index: number) => void;
}

export const ProfileView = ({ profile, photos, interests, emailVerified = false, showPhotos = true, onPhotoClick }: ProfileViewProps) => {
  const [foundingMember, setFoundingMember] = useState<{ order_number: number } | null>(null);

  useEffect(() => {
    const checkFoundingMember = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('founding_members')
        .select('order_number')
        .eq('user_id', profile.id)
        .single();
      if (data) setFoundingMember(data);
    };
    checkFoundingMember();
  }, [profile?.id]);

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
      {/* Photos Grid - conditionally shown */}
      {showPhotos && photos.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className={`relative aspect-square group ${onPhotoClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onPhotoClick?.(index)}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Photo ${index + 1}`}
                    className={`w-full h-full object-cover rounded-lg ${onPhotoClick ? 'hover:opacity-90 transition-opacity' : ''}`}
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
      )}

      {/* Basic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <span>
                    {profile.display_name}
                    {age && <span className="text-muted-foreground">, {age}</span>}
                  </span>
                  {emailVerified && (
                    <CheckCircle className="h-6 w-6 text-primary fill-primary" />
                  )}
                </h2>
                {foundingMember && (
                  <FoundingMemberBadge orderNumber={foundingMember.order_number} />
                )}
              </div>
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

      {/* Social Media Handles */}
      {(profile.instagram_handle || profile.twitter_handle || profile.linkedin_handle || profile.snapchat_handle) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Social Media</h3>
            <div className="flex flex-wrap gap-3">
              {profile.instagram_handle && (
                <a 
                  href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity"
                >
                  <Instagram className="h-4 w-4" />
                  <span className="text-sm">{profile.instagram_handle}</span>
                </a>
              )}
              {profile.twitter_handle && (
                <a 
                  href={`https://twitter.com/${profile.twitter_handle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
                >
                  <Twitter className="h-4 w-4" />
                  <span className="text-sm">{profile.twitter_handle}</span>
                </a>
              )}
              {profile.linkedin_handle && (
                <a 
                  href={profile.linkedin_handle.includes('linkedin.com') ? `https://${profile.linkedin_handle.replace('https://', '')}` : `https://linkedin.com/in/${profile.linkedin_handle}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white rounded-full hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="h-4 w-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {profile.snapchat_handle && (
                <a 
                  href={`https://snapchat.com/add/${profile.snapchat_handle.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFFC00] text-black rounded-full hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.99.99 0 0 1 .42-.09c.201 0 .36.03.42.09.18.12.27.27.3.42.045.18.015.39-.03.54-.03.105-.074.18-.148.27-.106.13-.344.27-.674.42a4.26 4.26 0 0 1-.749.24c-.106.03-.203.06-.284.09-.061.015-.09.03-.075.06.27.63.69 1.215 1.2 1.68.46.42.974.72 1.47.899.166.06.33.09.45.12.12.03.21.06.27.09a.42.42 0 0 1 .18.105.3.3 0 0 1 .09.18.24.24 0 0 1-.045.195c-.18.375-.72.555-1.068.689-.21.075-.39.135-.494.18a4.12 4.12 0 0 0-.27.12c-.106.06-.135.15-.135.285 0 .065-.01.135-.02.21-.02.12-.02.18 0 .27.06.165.27.285.465.345a1.14 1.14 0 0 0 .33.045c.45 0 .93-.18 1.365-.345.24-.09.465-.195.69-.285.06-.03.12-.045.195-.045.165 0 .33.06.45.165.135.12.21.285.21.465 0 .165-.06.315-.18.435-.345.345-.99.6-1.86.735-.12.018-.24.03-.36.03h-.495c-.255 0-.54.03-.78.06l-.225.03c-.135.018-.27.03-.375.045-.285.045-.57.15-.825.39-.36.33-.675.915-1.455 1.38-.615.375-1.41.57-2.385.57-.93 0-1.71-.195-2.325-.54-.78-.45-1.095-1.02-1.44-1.35-.24-.24-.525-.345-.825-.375-.12-.02-.24-.03-.375-.045l-.225-.03c-.255-.03-.54-.06-.81-.06h-.45c-.12 0-.24-.01-.36-.03-.87-.135-1.515-.39-1.86-.735a.648.648 0 0 1-.18-.435c0-.18.075-.345.21-.465a.6.6 0 0 1 .45-.165c.075 0 .135.015.195.045.225.09.45.195.69.285.435.165.915.345 1.365.345a1.14 1.14 0 0 0 .33-.045c.195-.06.405-.18.465-.345.02-.09.02-.15 0-.27a1.44 1.44 0 0 0-.02-.21c0-.135-.03-.225-.135-.285a4.12 4.12 0 0 0-.27-.12 5.7 5.7 0 0 1-.494-.18c-.348-.134-.888-.314-1.068-.689a.24.24 0 0 1-.045-.195.3.3 0 0 1 .09-.18.42.42 0 0 1 .18-.105c.06-.03.15-.06.27-.09.12-.03.284-.06.45-.12a4.96 4.96 0 0 0 1.47-.899c.51-.465.93-1.05 1.2-1.68.015-.03-.014-.045-.075-.06-.08-.03-.177-.06-.284-.09a4.26 4.26 0 0 1-.749-.24c-.33-.15-.568-.29-.674-.42a.714.714 0 0 1-.148-.27c-.045-.15-.075-.36-.03-.54.03-.15.12-.3.3-.42.06-.06.219-.09.42-.09a.99.99 0 0 1 .42.09c.374.18.733.285 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.859 1.07 11.216.793 12.206.793z"/>
                  </svg>
                  <span className="text-sm">{profile.snapchat_handle}</span>
                </a>
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
