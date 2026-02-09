import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallStatus, CallType } from '@/hooks/useWebRTC';

interface CallUIProps {
  callStatus: CallStatus;
  callType: CallType | null;
  formattedDuration: string;
  isMuted: boolean;
  isVideoOff: boolean;
  profile: any;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  setLocalVideoElement: (el: HTMLVideoElement | null) => void;
  setRemoteVideoElement: (el: HTMLVideoElement | null) => void;
}

export const CallUI = ({
  callStatus,
  callType,
  formattedDuration,
  isMuted,
  isVideoOff,
  profile,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  setLocalVideoElement,
  setRemoteVideoElement,
}: CallUIProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (localVideoRef.current) {
      setLocalVideoElement(localVideoRef.current);
    }
    if (remoteVideoRef.current) {
      setRemoteVideoElement(remoteVideoRef.current);
    }
  }, [setLocalVideoElement, setRemoteVideoElement, isMinimized]);

  const profilePhoto = profile?.photos?.sort((a: any, b: any) => a.display_order - b.display_order)[0]?.photo_url;

  // ── Minimized PiP widget ──
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        drag
        dragMomentum={false}
        className="fixed bottom-24 right-4 z-50 w-56 rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-black"
      >
        {/* Video preview or avatar */}
        {callType === 'video' ? (
          <div className="relative w-full h-36">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute bottom-1 right-1 w-12 h-16 rounded-md object-cover border border-white/30 ${isVideoOff ? 'hidden' : ''}`}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/30 to-primary/10">
            <Avatar className="h-10 w-10 ring-2 ring-primary/40">
              <AvatarImage src={profilePhoto} alt={profile?.display_name} />
              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.display_name || 'Unknown'}</p>
              <p className="text-white/60 text-xs">
                {callStatus === 'calling' ? 'Calling...' : formattedDuration}
              </p>
            </div>
          </div>
        )}

        {/* Mini controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/90">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/10"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Duration for video */}
        {callType === 'video' && callStatus === 'active' && (
          <p className="text-center text-white/70 text-xs pb-1">{formattedDuration}</p>
        )}
      </motion.div>
    );
  }

  // ── Full-screen call UI ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden"
    >
      {/* Minimize button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/10 rounded-full"
          onClick={() => setIsMinimized(true)}
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Video container for video calls */}
      {callType === 'video' && (
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 right-4 w-24 h-32 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg z-10"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
            />
            {isVideoOff && (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <VideoOff className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </motion.div>

          {callStatus === 'calling' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/50 to-black/80">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-white/20">
                  <AvatarImage src={profilePhoto} alt={profile?.display_name} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {profile?.display_name || 'Unknown'}
                </h2>
                <p className="text-white/60 animate-pulse">Calling...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio call display */}
      {callType === 'audio' && (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-primary/20 to-black">
          <div className="text-center">
            <motion.div
              animate={callStatus === 'calling' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Avatar className="h-40 w-40 mx-auto mb-6 ring-4 ring-primary/50">
                <AvatarImage src={profilePhoto} alt={profile?.display_name} />
                <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                  {profile?.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {profile?.display_name || 'Unknown'}
            </h2>
            {callStatus === 'calling' && (
              <p className="text-white/60 animate-pulse">Calling...</p>
            )}
            {callStatus === 'active' && (
              <p className="text-white/80 text-lg">{formattedDuration}</p>
            )}
          </div>
        </div>
      )}

      {/* Call controls */}
      <div className="p-8 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="lg"
            className="h-16 w-16 rounded-full"
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            className="h-20 w-20 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="h-8 w-8" />
          </Button>
          {callType === 'video' && (
            <Button
              variant={isVideoOff ? 'destructive' : 'secondary'}
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={onToggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          )}
        </div>
        {callStatus === 'active' && callType === 'video' && (
          <p className="text-center text-white/80 mt-4 text-lg">{formattedDuration}</p>
        )}
      </div>
    </motion.div>
  );
};
