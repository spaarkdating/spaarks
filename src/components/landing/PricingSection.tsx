import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: <Star className="h-6 w-6" />,
    features: ['10 swipes/day', '5 active matches', 'Text messaging', '10 messages/match'],
    gradient: 'from-slate-500/10 to-slate-600/10',
  },
  {
    name: 'Plus',
    price: 149,
    icon: <Zap className="h-6 w-6" />,
    features: ['30 swipes/day', '15 active matches', 'Unlimited text', 'See 3 profile viewers', '1 image/chat/day'],
    gradient: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    name: 'Pro',
    price: 249,
    icon: <Sparkles className="h-6 w-6" />,
    popular: true,
    features: ['Unlimited swipes', 'Unlimited matches', 'Voice messaging', 'See 10 viewers', '5 images + 1 video/day'],
    gradient: 'from-primary/10 to-accent/10',
  },
  {
    name: 'Elite',
    price: 399,
    icon: <Crown className="h-6 w-6" />,
    features: ['Everything in Pro', 'Video messaging', 'All viewers + timestamps', 'Unlimited media', 'Priority support'],
    gradient: 'from-amber-500/10 to-orange-500/10',
  },
];

export const PricingSection = () => {
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
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

                <CardHeader className={`relative text-center pb-2 ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                  <div
                    className={`mx-auto mb-4 p-4 rounded-2xl ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-primary to-primary-light text-primary-foreground shadow-lg' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold text-foreground font-display">₹{plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground">/mo</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative pb-8">
                  <ul className="space-y-3 mb-6 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.popular ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Check className={`h-3 w-3 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
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
