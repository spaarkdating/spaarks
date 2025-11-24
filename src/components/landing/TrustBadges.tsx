import { motion } from "framer-motion";
import { Shield, Lock, CreditCard, Award, CheckCircle2, Star } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "SSL Secured",
    description: "256-bit Encryption"
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "GDPR Compliant"
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "PCI DSS Certified"
  },
  {
    icon: Award,
    title: "Verified Profiles",
    description: "ID Verification"
  },
  {
    icon: CheckCircle2,
    title: "Trusted Platform",
    description: "50K+ Members"
  },
  {
    icon: Star,
    title: "Top Rated",
    description: "4.8/5 Rating"
  }
];

export const TrustBadges = () => {
  return (
    <section className="container mx-auto px-4 py-20 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands</h2>
        <p className="text-lg text-white/90 max-w-2xl mx-auto">
          Your safety and privacy are our top priorities. We use industry-leading security measures.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
        {badges.map((badge, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex flex-col items-center gap-3 p-6 bg-card/80 backdrop-blur-sm rounded-2xl border border-border hover:border-primary/50 transition-all hover:shadow-glow group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <badge.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
              <p className="text-xs text-white/70">{badge.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Partner Logos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 pt-16 border-t border-border/50"
      >
        <h3 className="text-center text-lg font-semibold mb-8 text-white/90">
          Integrated with Trusted Services
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
          {["Stripe", "PayPal", "Google", "Apple", "Meta", "AWS"].map((partner, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ scale: 1.1 }}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};
