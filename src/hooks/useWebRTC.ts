import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { callSounds } from '@/lib/callSounds';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
export type CallType = 'audio' | 'video';

interface UseWebRTCOptions {
  currentUserId: string;
  onCallEnded?: () => void;
}

export interface CallSession {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
  end_reason?: string;
  created_at?: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export function useWebRTC({ currentUserId, onCallEnded }: UseWebRTCOptions) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [callerProfile, setCallerProfile] = useState<any>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use ref to track current call status for callbacks (avoids stale closure)
  const callStatusRef = useRef<CallStatus>('idle');
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const { toast } = useToast();

  // Keep ref in sync with state
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop any playing sounds immediately and completely
    try {
      callSounds.stop();
    } catch (e) {
      console.error('Error stopping call sounds:', e);
    }
    
    // Clear call timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // Set video refs
  const setLocalVideoElement = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      el.srcObject = localStreamRef.current;
    }
  }, []);

  const setRemoteVideoElement = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      el.srcObject = remoteStreamRef.current;
    }
  }, []);

  // Initialize peer connection
  const createPeerConnection = useCallback((receiverId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            from: currentUserId,
            to: receiverId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall('connection_lost');
      }
    };

    return pc;
  }, [currentUserId]);

  // Setup signaling channel
  const setupSignalingChannel = useCallback(async (sessionId: string, remoteUserId: string) => {
    const channel = supabase.channel(`call:${sessionId}`);

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer,
            from: currentUserId,
            to: remoteUserId,
          },
        });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        const pc = peerConnectionRef.current;
        if (!pc) return;

        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error('Error adding ice candidate:', e);
        }
      })
      .on('broadcast', { event: 'call-accepted' }, async ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        // Stop calling sound and play connected sound
        callSounds.stop();
        callSounds.playConnectedSound();
        
        setCallStatus('active');
        startCallTimer();
        
        // Create and send offer
        const pc = peerConnectionRef.current;
        if (!pc) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer,
            from: currentUserId,
            to: remoteUserId,
          },
        });
      })
      .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        // Stop sounds and play ended sound
        callSounds.stop();
        callSounds.playEndedSound();
        
        toast({
          title: 'Call ended',
          description: payload.reason || 'The call has ended',
        });
        cleanup();
        // Reset to idle so user can make/receive new calls
        setCallStatus('idle');
        setCallType(null);
        setCallSession(null);
        setIncomingCall(null);
        onCallEnded?.();
      })
      .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
        if (payload.to !== currentUserId) return;
        
        // Stop calling sound
        callSounds.stop();
        
        toast({
          title: 'Call declined',
          description: 'The user declined your call',
        });
        cleanup();
        setCallStatus('idle');
        setCallSession(null);
      });

    // Wait for channel to be properly subscribed
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve();
        }
      });
    });

    channelRef.current = channel;
    return channel;
  }, [currentUserId, cleanup, onCallEnded, toast]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // Start a call
  const startCall = useCallback(async (receiverId: string, type: CallType) => {
    // Prevent starting a call if not idle
    if (callStatusRef.current !== 'idle') {
      toast({
        title: 'Cannot start call',
        description: 'Please wait for the current call to end.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setCallType(type);
      setCallStatus('calling');
      
      // Start playing calling sound
      callSounds.playCallingSound();

      // Get media stream with HD video constraints
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
        } : false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create call session in database
      const { data: session, error } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: currentUserId,
          receiver_id: receiverId,
          call_type: type,
          status: 'ringing',
        })
        .select()
        .single();

      if (error) throw error;

      setCallSession({ ...session, call_type: session.call_type as CallType });

      // Create peer connection
      const pc = createPeerConnection(receiverId);
      peerConnectionRef.current = pc;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Setup signaling
      await setupSignalingChannel(session.id, receiverId);

      // Send call notification via realtime
      const notifyChannel = supabase.channel(`user:${receiverId}`);
      
      // Wait for channel to be subscribed before sending
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        notifyChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout);
            reject(new Error('Failed to connect signaling channel'));
          }
        });
      });
      
      // Send the call notification
      await notifyChannel.send({
        type: 'broadcast',
        event: 'incoming-call',
        payload: {
          session,
          callerId: currentUserId,
        },
      });
      
      // Cleanup the notification channel after sending
      setTimeout(() => {
        supabase.removeChannel(notifyChannel);
      }, 1000);

      // Timeout after 30 seconds - use ref to check current status
      callTimeoutRef.current = setTimeout(() => {
        // Use ref to get current status (avoids stale closure)
        if (callStatusRef.current === 'calling') {
          endCall('no_answer');
        }
      }, 30000);

    } catch (error: any) {
      console.error('Error starting call:', error);
      callSounds.stop();
      cleanup();
      setCallStatus('idle');
      setCallType(null);
      setCallSession(null);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: 'Permission denied',
          description: `Please allow ${type === 'video' ? 'camera and ' : ''}microphone access to make calls.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Call failed',
          description: error.message || 'Failed to start call',
          variant: 'destructive',
        });
      }
    }
  }, [currentUserId, createPeerConnection, setupSignalingChannel, cleanup, toast]);

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      // Stop ringtone and play connected sound
      callSounds.stop();
      callSounds.playConnectedSound();
      
      setCallType(incomingCall.call_type as CallType);
      setCallStatus('active');
      setCallSession(incomingCall);

      // Get media stream with HD video constraints
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: incomingCall.call_type === 'video' ? {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user',
        } : false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = createPeerConnection(incomingCall.caller_id);
      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Setup signaling
      const channel = await setupSignalingChannel(incomingCall.id, incomingCall.caller_id);

      // Update call status in database
      await supabase
        .from('call_sessions')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', incomingCall.id);

      // Notify caller
      channel.send({
        type: 'broadcast',
        event: 'call-accepted',
        payload: {
          from: currentUserId,
          to: incomingCall.caller_id,
        },
      });

      setIncomingCall(null);
      startCallTimer();

    } catch (error: any) {
      console.error('Error answering call:', error);
      declineCall();
      
      toast({
        title: 'Failed to answer',
        description: error.message || 'Could not answer the call',
        variant: 'destructive',
      });
    }
  }, [incomingCall, currentUserId, createPeerConnection, setupSignalingChannel, startCallTimer, toast]);

  // Decline incoming call
  const declineCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // Stop ringtone
    callSounds.stop();

    try {
      await supabase
        .from('call_sessions')
        .update({ status: 'declined', ended_at: new Date().toISOString() })
        .eq('id', incomingCall.id);

      // Notify caller
      const channel = supabase.channel(`call:${incomingCall.id}`);
      await channel.subscribe();
      
      channel.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: {
          from: currentUserId,
          to: incomingCall.caller_id,
        },
      });

      supabase.removeChannel(channel);

    } catch (error) {
      console.error('Error declining call:', error);
    } finally {
      // Always reset state
      setIncomingCall(null);
      setCallerProfile(null);
      setCallStatus('idle');
      setCallType(null);
    }
  }, [incomingCall, currentUserId]);

  // End call
  const endCall = useCallback(async (reason?: string) => {
    // Stop any sounds immediately and completely
    try {
      callSounds.stop();
    } catch (e) {
      console.error('Error stopping sounds:', e);
    }
    
    // Play ended sound after stopping all other sounds
    setTimeout(() => {
      try {
        callSounds.playEndedSound();
      } catch (e) {
        // Ignore
      }
    }, 100);
    
    if (!callSession) {
      cleanup();
      setCallStatus('idle');
      setCallType(null);
      return;
    }

    try {
      const endData: any = {
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: callDuration,
      };
      
      if (reason) {
        endData.end_reason = reason;
      }

      await supabase
        .from('call_sessions')
        .update(endData)
        .eq('id', callSession.id);

      // Notify other user
      if (channelRef.current) {
        const otherUserId = callSession.caller_id === currentUserId 
          ? callSession.receiver_id 
          : callSession.caller_id;

        channelRef.current.send({
          type: 'broadcast',
          event: 'call-ended',
          payload: {
            from: currentUserId,
            to: otherUserId,
            reason: reason || 'Call ended',
          },
        });
      }

    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      cleanup();
      // Reset to idle so user can make/receive new calls
      setCallStatus('idle');
      setCallType(null);
      setCallSession(null);
      onCallEnded?.();
    }
  }, [callSession, callDuration, currentUserId, cleanup, onCallEnded]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  // Listen for incoming calls - only depend on currentUserId to avoid re-subscribing
  useEffect(() => {
    if (!currentUserId) return;
    
    const channel = supabase.channel(`user:${currentUserId}`);

    channel
      .on('broadcast', { event: 'incoming-call' }, async ({ payload }) => {
        // Use ref to check current status (avoids stale closure and re-subscription issues)
        if (callStatusRef.current !== 'idle') {
          // User is busy
          const busyChannel = supabase.channel(`call:${payload.session.id}`);
          await busyChannel.subscribe();
          
          busyChannel.send({
            type: 'broadcast',
            event: 'call-ended',
            payload: {
              from: currentUserId,
              to: payload.callerId,
              reason: 'User is busy',
            },
          });

          await supabase
            .from('call_sessions')
            .update({ status: 'busy', ended_at: new Date().toISOString() })
            .eq('id', payload.session.id);

          supabase.removeChannel(busyChannel);
          return;
        }

        // Fetch caller profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, photos(photo_url, display_order)')
          .eq('id', payload.callerId)
          .single();

        setCallerProfile(profile);
        setIncomingCall(payload.session);
        
        // Start playing ringtone for incoming call
        callSounds.playRingtone();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]); // Only re-subscribe when user changes, not on every status change

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callStatus,
    callType,
    callSession,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    isMuted,
    isVideoOff,
    incomingCall,
    callerProfile,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    setLocalVideoElement,
    setRemoteVideoElement,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
  };
}
