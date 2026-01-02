import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, X, Star, MapPin, Briefcase, CheckCircle, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OnlineStatus } from "@/components/profile/OnlineStatus";
import { CompatibilityBadge } from "@/components/swipe/CompatibilityBadge";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  bio: string;
  date_of_birth: string;
  location: string;
  college?: string;
  photos: { photo_url: string }[];
  interests: { interest: { name: string } }[];
  email_verified?: boolean;
  gender?: string;
  looking_for?: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right" | "super") => void;
  style?: any;
  compatibilityScore?: number;
  onProfileClick?: () => void;
}

export const SwipeCard = ({ profile, onSwipe, style, compatibilityScore, onProfileClick }: SwipeCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  useEffect(() => {
    const checkFoundingMember = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('founding_members')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      setIsFoundingMember(!!data);
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

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 150) {
      setExitX(info.offset.x > 0 ? 300 : -300);
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex]?.photo_url || "/placeholder.svg";
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="w-full h-full bg-card rounded-3xl overflow-hidden border-2 border-border/50 shadow-[var(--shadow-elevated)]">
        {/* Photo */}
        <div className="relative h-2/3 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
          <img
            src={currentPhoto}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          
          {/* Compatibility & Online Status Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {compatibilityScore !== undefined && (
                <CompatibilityBadge score={compatibilityScore} className="animate-fade-in-scale" />
              )}
              <OnlineStatus userId={profile.id} showLabel />
            </div>
          </div>
          
          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-16 left-0 right-0 flex gap-1 px-4">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full ${
                    index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Swipe indicators */}
          <motion.div
            className="absolute top-1/4 left-8 text-5xl font-bold text-primary border-4 border-primary rounded-2xl px-6 py-3 rotate-12 bg-card/90 backdrop-blur-sm shadow-lg"
            style={{ opacity: useTransform(x, [0, 150], [0, 1]) }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-1/4 right-8 text-5xl font-bold text-destructive border-4 border-destructive rounded-2xl px-6 py-3 -rotate-12 bg-card/90 backdrop-blur-sm shadow-lg"
            style={{ opacity: useTransform(x, [-150, 0], [1, 0]) }}
          >
            NOPE
          </motion.div>

          {/* Tap zones for changing photos */}
          {photos.length > 1 && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
                onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
                onClick={() => setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))}
              />
            </>
          )}
        </div>

        {/* Info */}
        <div 
          className="h-1/3 p-6 overflow-y-auto bg-gradient-to-b from-card to-card/80 cursor-pointer hover:bg-card/90 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (onProfileClick) onProfileClick();
          }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h2 className="text-2xl font-bold flex items-center gap-2 gradient-text">
              <span>
                {profile.display_name}
                {age && <span className="text-foreground/70">, {age}</span>}
              </span>
              {profile.email_verified && (
                <CheckCircle className="h-5 w-5 text-primary fill-primary animate-pulse" />
              )}
            </h2>
            {isFoundingMember && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Founder
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-3">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
            {profile.college && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">{profile.college}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-foreground/80 mb-4 leading-relaxed">{profile.bio}</p>

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 6).map((userInterest, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {userInterest.interest.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
