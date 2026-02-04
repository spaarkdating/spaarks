import { Phone, Video, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CallButtonsProps {
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  currentUserId: string;
  disabled?: boolean;
}

export const CallButtons = ({
  onStartAudioCall,
  onStartVideoCall,
  currentUserId,
  disabled = false,
}: CallButtonsProps) => {
  const { limits } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkCallLimit = async (callType: 'audio' | 'video'): Promise<boolean> => {
    const canCall = callType === 'audio' ? limits?.can_audio_call : limits?.can_video_call;
    
    if (!canCall) {
      toast({
        title: `${callType === 'audio' ? 'Audio' : 'Video'} calls not available`,
        description: 'Upgrade your plan to make calls.',
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        ),
      });
      return false;
    }

    const dailyLimit = callType === 'audio' ? limits?.audio_calls_per_day : limits?.video_calls_per_day;
    
    if (dailyLimit === null) return true; // Unlimited

    // Check today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('audio_calls_made, video_calls_made')
      .eq('user_id', currentUserId)
      .eq('date', today)
      .single();

    const callsMade = callType === 'audio' 
      ? ((usage as any)?.audio_calls_made || 0)
      : ((usage as any)?.video_calls_made || 0);

    if (callsMade >= dailyLimit) {
      toast({
        title: 'Daily call limit reached',
        description: `You've used all your ${callType} calls for today. Upgrade for more!`,
        variant: 'destructive',
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        ),
      });
      return false;
    }

    return true;
  };

  const handleAudioCall = async () => {
    const canCall = await checkCallLimit('audio');
    if (canCall) {
      // Increment usage
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('id, audio_calls_made')
        .eq('user_id', currentUserId)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('usage_tracking')
          .update({ audio_calls_made: (existing.audio_calls_made || 0) + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('usage_tracking')
          .insert({ user_id: currentUserId, date: today, audio_calls_made: 1 });
      }

      onStartAudioCall();
    }
  };

  const handleVideoCall = async () => {
    const canCall = await checkCallLimit('video');
    if (canCall) {
      // Increment usage
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('usage_tracking')
        .select('id, video_calls_made')
        .eq('user_id', currentUserId)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('usage_tracking')
          .update({ video_calls_made: (existing.video_calls_made || 0) + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('usage_tracking')
          .insert({ user_id: currentUserId, date: today, video_calls_made: 1 });
      }

      onStartVideoCall();
    }
  };

  const canAudioCall = limits?.can_audio_call;
  const canVideoCall = limits?.can_video_call;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${canAudioCall ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground'}`}
            onClick={handleAudioCall}
            disabled={disabled || !canAudioCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canAudioCall ? 'Audio call' : 'Upgrade to make audio calls'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-full ${canVideoCall ? 'text-blue-500 hover:bg-blue-500/10' : 'text-muted-foreground'}`}
            onClick={handleVideoCall}
            disabled={disabled || !canVideoCall}
          >
            <Video className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {canVideoCall ? 'Video call' : 'Upgrade to make video calls'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
