import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchNotificationProps {
  matchedProfile: {
    display_name: string;
    photos: { photo_url: string }[];
  };
  onClose: () => void;
}

export const MatchNotification = ({ matchedProfile, onClose }: MatchNotificationProps) => {
  const navigate = useNavigate();
  const photo = matchedProfile.photos?.[0]?.photo_url || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="max-w-md w-full"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="text-center space-y-6">
          {/* Heart animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="flex justify-center"
          >
            <Heart className="h-24 w-24 text-primary fill-primary" />
          </motion.div>

          <h2 className="text-4xl font-bold text-white">It's a Match!</h2>
          
          <p className="text-white/80">
            You and {matchedProfile.display_name} liked each other
          </p>

          {/* Profile photo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="flex justify-center"
          >
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
              <img
                src={photo}
                alt={matchedProfile.display_name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Action buttons */}
          <div className="space-y-3 pt-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              onClick={() => {
                onClose();
                // Navigate to messages - to be implemented
              }}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Send a Message
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={onClose}
            >
              Keep Swiping
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
