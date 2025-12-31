import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/navigation/Header';
import { generatePlanFeatures, SubscriptionPlanData } from '@/lib/planFeatures';

interface DisplayPlan extends SubscriptionPlanData {
  id: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Star className="h-6 w-6" />,
  plus: <Zap className="h-6 w-6" />,
  pro: <Sparkles className="h-6 w-6" />,
  elite: <Crown className="h-6 w-6" />,
};

export default function Pricing() {
  const navigate = useNavigate();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [foundingMemberCount, setFoundingMemberCount] = useState(0);
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    checkFoundingMemberStatus();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_inr', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: 'Error loading plans',
        description: 'Please refresh the page to try again.',
        variant: 'destructive',
      });
    } else if (data) {
      const displayPlans: DisplayPlan[] = data.map((plan) => ({
        ...plan,
        features: generatePlanFeatures(plan as SubscriptionPlanData),
        icon: planIcons[plan.name] || <Star className="h-6 w-6" />,
        popular: plan.name === 'pro',
      }));
      setPlans(displayPlans);
    }
    setLoading(false);
  };

  const checkFoundingMemberStatus = async () => {
    const { count } = await supabase
      .from('founding_members')
      .select('*', { count: 'exact', head: true });
    
    setFoundingMemberCount(count || 0);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('founding_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsFoundingMember(!!data);
    }
  };

  const handleSubscribe = async (plan: DisplayPlan) => {
    if (plan.name === "free") return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    navigate(`/checkout?plan=${plan.name}`);
  };

  if (loading) {
    return (
      <>
        <SEO title="Pricing - Spaark" description="Choose the perfect plan for your dating journey." />
        <Header />
        <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Pricing - Spaark"
        description="Choose the perfect plan for your dating journey. From free to Elite, find the features that match your needs."
      />
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Unlock more features and find your perfect match faster
            </p>
            
            {foundingMemberCount < 100 && (
              <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">
                  <span className="text-amber-500">{100 - foundingMemberCount} spots left</span>
                  {' '}for Founding Members! Get 20% more limits forever.
                </span>
              </div>
            )}

            {isFoundingMember && (
              <Badge className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500">
                <Crown className="h-3 w-3 mr-1" />
                Founding Member - Price Locked Forever!
              </Badge>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.name;
              
              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all hover:shadow-lg flex flex-col ${
                    plan.popular ? 'border-primary shadow-lg scale-105' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-3 p-3 rounded-full ${
                      plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">₹{plan.price_inr}</span>
                      {plan.price_inr > 0 && <span className="text-muted-foreground">/month</span>}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      disabled={isCurrentPlan || subscriptionLoading || processingPlan === plan.name}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {processingPlan === plan.name
                        ? "Processing..."
                        : isCurrentPlan
                        ? "Current Plan"
                        : plan.price_inr === 0
                        ? "Get Started"
                        : "Subscribe"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>All subscriptions auto-renew monthly. Cancel anytime from your profile settings.</p>
            <p className="mt-2">Founding members get their price locked forever and 20% bonus on all limits!</p>
          </div>
        </div>
      </div>
    </>
  );
}
