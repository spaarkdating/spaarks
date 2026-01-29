import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { generateShortFeatures, SubscriptionPlanData } from '@/lib/planFeatures';

interface DisplayPlan extends SubscriptionPlanData {
  id: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  gradient: string;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Star className="h-6 w-6" />,
  plus: <Zap className="h-6 w-6" />,
  pro: <Sparkles className="h-6 w-6" />,
  elite: <Crown className="h-6 w-6" />,
};

const planGradients: Record<string, string> = {
  free: 'from-slate-500/10 to-slate-600/10',
  plus: 'from-blue-500/10 to-cyan-500/10',
  pro: 'from-primary/10 to-accent/10',
  elite: 'from-amber-500/10 to-orange-500/10',
};

export const PricingSection = () => {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_inr', { ascending: true });

    if (!error && data) {
      const displayPlans: DisplayPlan[] = data.map((plan) => ({
        ...plan,
        features: generateShortFeatures(plan as SubscriptionPlanData),
        icon: planIcons[plan.name] || <Star className="h-6 w-6" />,
        popular: plan.name === 'pro',
        gradient: planGradients[plan.name] || 'from-slate-500/10 to-slate-600/10',
      }));
      setPlans(displayPlans);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Start free and upgrade when you're ready for more
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <Card
                className={`relative h-full transition-all duration-300 border border-border/50 rounded-3xl overflow-hidden hover:border-primary/30 hover:-translate-y-2 ${
                  plan.popular ? 'border-primary shadow-xl ring-2 ring-primary/20' : ''
                }`}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {plan.popular && (
                  <div className="absolute -top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary-light text-primary-foreground py-2 text-xs font-semibold text-center">
                    Most Popular
                  </div>
                )}

                <CardHeader className={`relative text-center pb-2 ${plan.popular ? 'pt-10 sm:pt-12' : 'pt-6 sm:pt-8'}`}>
                  <div
                    className={`mx-auto mb-2 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-lg' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="font-display text-base sm:text-xl">{plan.display_name}</CardTitle>
                  <CardDescription className="mt-1 sm:mt-2">
                    <span className="text-xl sm:text-3xl font-bold text-foreground font-display">₹{plan.price_inr}</span>
                    {plan.price_inr > 0 && <span className="text-muted-foreground text-xs sm:text-base">/mo</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative pb-4 sm:pb-8 px-3 sm:px-6">
                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 text-xs sm:text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 sm:gap-3">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Check className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-muted-foreground leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link to="/pricing">
            <Button variant="glow" size="lg">
              View All Plans
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-6">
            <span className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full font-medium">
              <Crown className="w-4 h-4" />
              First 100 users get Founding Member status with 20% bonus limits
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
