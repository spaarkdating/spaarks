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
  },
  {
    name: 'Plus',
    price: 149,
    icon: <Zap className="h-6 w-6" />,
    features: ['30 swipes/day', '15 active matches', 'Unlimited text', 'See 3 profile viewers', '1 image/chat/day'],
  },
  {
    name: 'Pro',
    price: 249,
    icon: <Sparkles className="h-6 w-6" />,
    popular: true,
    features: ['Unlimited swipes', 'Unlimited matches', 'Voice messaging', 'See 10 viewers', '5 images + 1 video/day'],
  },
  {
    name: 'Elite',
    price: 399,
    icon: <Crown className="h-6 w-6" />,
    features: ['Everything in Pro', 'Video messaging', 'All viewers + timestamps', 'Unlimited media', 'Priority support'],
  },
];

export const PricingSection = () => {
  return (
    <section className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unlock more features and find your perfect match faster
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card
                className={`relative h-full transition-all hover:shadow-lg ${
                  plan.popular ? 'border-primary shadow-lg ring-2 ring-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div
                    className={`mx-auto mb-3 p-3 rounded-full ${
                      plan.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                    {plan.price > 0 && <span className="text-muted-foreground">/mo</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-4 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link to="/pricing">
            <Button size="lg" className="rounded-full px-8">
              View All Plans
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            First 100 users get <span className="text-amber-500 font-medium">Founding Member</span> status with 20% bonus limits!
          </p>
        </motion.div>
      </div>
    </section>
  );
};
