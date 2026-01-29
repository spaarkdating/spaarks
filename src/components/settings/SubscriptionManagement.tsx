import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Zap, Sparkles, Star, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { FoundingMemberBadge } from '@/components/profile/FoundingMemberBadge';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const planIcons: Record<string, React.ReactNode> = {
  free: <Star className="h-5 w-5" />,
  plus: <Zap className="h-5 w-5" />,
  pro: <Sparkles className="h-5 w-5" />,
  elite: <Crown className="h-5 w-5" />,
};

const planColors: Record<string, string> = {
  free: 'bg-muted',
  plus: 'bg-blue-500',
  pro: 'bg-purple-500',
  elite: 'bg-gradient-to-r from-amber-500 to-orange-500',
};

export const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const { subscription, limits, loading } = useSubscription();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark subscription as cancelled but keep it active until expiry
      // The subscription will remain usable until expires_at
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancelled_at: new Date().toISOString()
          // Note: status stays 'active' - user keeps access until expires_at
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled. You can continue using your current plan until the end of the billing period.',
      });

      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-xl border-2">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const isFoundingMember = subscription?.is_founding_member || false;

  return (
    <Card className="shadow-xl border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {planIcons[currentPlan]}
          Subscription
        </CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full text-white ${planColors[currentPlan]}`}>
              {planIcons[currentPlan]}
            </div>
            <div>
              <p className="font-semibold text-lg capitalize">{limits?.display_name || currentPlan} Plan</p>
              {subscription?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelled_at 
                    ? `Cancelled - Access until ${format(new Date(subscription.expires_at), 'MMM d, yyyy')}`
                    : `Renews on ${format(new Date(subscription.expires_at), 'MMM d, yyyy')}`
                  }
                </p>
              )}
              {subscription?.cancelled_at && (
                <Badge variant="secondary" className="mt-1 text-yellow-600">Cancelled</Badge>
              )}
            </div>
          </div>
          {isFoundingMember && <FoundingMemberBadge />}
        </div>

        {/* Plan Limits Overview */}
        {limits && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Your Plan Includes:</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Daily Swipes</span>
                <span className="font-medium">{limits.daily_swipes_limit === null ? '∞' : limits.daily_swipes_limit}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Active Matches</span>
                <span className="font-medium">{limits.active_matches_limit === null ? '∞' : limits.active_matches_limit}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Messages/Match</span>
                <span className="font-medium">{limits.messages_per_match_limit === null ? '∞' : limits.messages_per_match_limit}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Profile Views</span>
                <span className="font-medium">{limits.profile_views_limit === null ? '∞' : (limits.profile_views_limit === 0 ? 'None' : limits.profile_views_limit)}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Voice Messages</span>
                <span className="font-medium">{limits.can_send_voice ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span>Video Messages</span>
                <span className="font-medium">{limits.can_send_video ? 'Yes' : 'No'}</span>
              </div>
            </div>
            {isFoundingMember && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Crown className="h-3 w-3" />
                All limits include 20% founding member bonus!
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {currentPlan === 'free' ? (
            <Button 
              className="w-full bg-gradient-to-r from-primary to-accent"
              onClick={() => navigate('/pricing')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade Your Plan
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/pricing')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Change Plan
              </Button>
              
              {subscription?.status === 'active' && !subscription?.cancelled_at && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your subscription? You'll continue to have access to your current plan features until the end of your billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
