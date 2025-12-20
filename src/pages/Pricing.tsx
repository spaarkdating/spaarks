import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/navigation/Header';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_inr: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'free',
    display_name: 'Free',
    price_inr: 0,
    icon: <Star className="h-6 w-6" />,
    features: [
      '10 swipes per day',
      'Up to 5 active matches',
      'Text only messaging',
      '10 messages per match',
      'Cannot see profile viewers',
    ],
  },
  {
    id: 'plus',
    name: 'plus',
    display_name: 'Plus',
    price_inr: 149,
    icon: <Zap className="h-6 w-6" />,
    features: [
      '30 swipes per day',
      'Up to 15 active matches',
      'Unlimited text messaging',
      'See last 3 profile viewers',
      '1 image per chat per day',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    display_name: 'Pro',
    price_inr: 249,
    icon: <Sparkles className="h-6 w-6" />,
    popular: true,
    features: [
      'Unlimited swipes',
      'Unlimited active matches',
      'Text + Voice messaging',
      'See last 10 profile viewers',
      '5 images per chat per day',
      '1 video per chat (15s)',
      '2 audio messages per day',
    ],
  },
  {
    id: 'elite',
    name: 'elite',
    display_name: 'Elite',
    price_inr: 399,
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Unlimited swipes',
      'Unlimited active matches',
      'Text + Voice + Video messaging',
      'See all profile viewers + timestamps',
      'Unlimited images',
      'Unlimited videos (30s)',
      'Unlimited audio messages',
      'Priority support',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [foundingMemberCount, setFoundingMemberCount] = useState(0);

  useEffect(() => {
    checkFoundingMemberStatus();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const checkFoundingMemberStatus = async () => {
    // Get current founding member count first (always runs)
    const { count } = await supabase
      .from('founding_members')
      .select('*', { count: 'exact', head: true });
    
    console.log('Founding member count:', count);
    setFoundingMemberCount(count || 0);

    // Check if current user is a founding member
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

  const handleSubscribe = async (plan: Plan) => {
    if (plan.name === "free") return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
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

  const getDisplayPrice = (plan: Plan) => {
    if (isFoundingMember && plan.price_inr > 0) {
      return plan.price_inr; // Price is already locked for founding members
    }
    return plan.price_inr;
  };

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
              const displayPrice = getDisplayPrice(plan);
              
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
                      <span className="text-3xl font-bold text-foreground">₹{displayPrice}</span>
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
                      disabled={isCurrentPlan || loading || processingPlan === plan.name}
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
