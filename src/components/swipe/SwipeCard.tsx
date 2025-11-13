import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Heart, X, Star, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  display_name: string;
  bio: string;
  date_of_birth: string;
  location: string;
  photos: { photo_url: string }[];
  interests: { interest: { name: string } }[];
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: "left" | "right" | "super") => void;
  style?: any;
}

export const SwipeCard = ({ profile, onSwipe, style }: SwipeCardProps) => {
  const [exitX, setExitX] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

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
      <div className="w-full h-full bg-card rounded-3xl shadow-2xl overflow-hidden border-2 border-border">
        {/* Photo */}
        <div className="relative h-2/3 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
          <img
            src={currentPhoto}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          
          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
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
            className="absolute top-1/4 left-8 text-6xl font-bold text-green-500 border-4 border-green-500 rounded-2xl px-6 py-2 rotate-12"
            style={{ opacity: useTransform(x, [0, 150], [0, 1]) }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-1/4 right-8 text-6xl font-bold text-red-500 border-4 border-red-500 rounded-2xl px-6 py-2 -rotate-12"
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
        <div className="h-1/3 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold">
              {profile.display_name}
              {age && <span className="text-muted-foreground">, {age}</span>}
            </h2>
          </div>

          {profile.location && (
            <div className="flex items-center gap-1 text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{profile.location}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>

          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 6).map((userInterest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
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
