import { motion } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallType } from '@/hooks/useWebRTC';

interface IncomingCallModalProps {
  callerProfile: any;
  callType: CallType;
  onAnswer: () => void;
  onDecline: () => void;
}

export const IncomingCallModal = ({
  callerProfile,
  callType,
  onAnswer,
  onDecline,
}: IncomingCallModalProps) => {
  const profilePhoto = callerProfile?.photos?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.photo_url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="text-center p-8"
      >
        {/* Pulsing ring animation */}
        <div className="relative mb-8">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary"
            style={{ width: 160, height: 160, margin: 'auto', left: 0, right: 0 }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="absolute inset-0 rounded-full bg-primary"
            style={{ width: 160, height: 160, margin: 'auto', left: 0, right: 0 }}
          />
          <Avatar className="h-40 w-40 mx-auto relative ring-4 ring-primary/50">
            <AvatarImage src={profilePhoto} alt={callerProfile?.display_name} />
            <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
              {callerProfile?.display_name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {callerProfile?.display_name || 'Unknown'}
        </h2>
        
        <p className="text-white/60 mb-8 flex items-center justify-center gap-2">
          {callType === 'video' ? (
            <>
              <Video className="h-5 w-5" />
              Incoming video call...
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              Incoming audio call...
            </>
          )}
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-8">
          <Button
            variant="destructive"
            size="lg"
            className="h-20 w-20 rounded-full"
            onClick={onDecline}
          >
            <PhoneOff className="h-8 w-8" />
          </Button>

          <Button
            size="lg"
            className="h-20 w-20 rounded-full bg-green-500 hover:bg-green-600"
            onClick={onAnswer}
          >
            {callType === 'video' ? (
              <Video className="h-8 w-8" />
            ) : (
              <Phone className="h-8 w-8" />
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
