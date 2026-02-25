import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Heart, UserCheck, Lock, Eye, MessageCircle, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
import { motion } from "framer-motion";

const AppLanding = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center shadow-sm">
              <img src={logo} alt="Spaark" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">Spaark</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 font-semibold text-sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero - Compact */}
      <section className="px-5 pt-8 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Heart className="h-10 w-10 text-primary fill-primary/20" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2 leading-tight">
            Welcome to Spaark
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Find real connections with verified people. Safe, private, and built for you.
          </p>
        </motion.div>
      </section>

      {/* Quick Actions */}
      <section className="px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/auth" className="block">
            <div className="bg-primary text-primary-foreground rounded-2xl p-4 text-center h-full">
              <UserCheck className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-semibold block">Sign Up</span>
              <span className="text-[11px] opacity-80">Create account</span>
            </div>
          </Link>
          <Link to="/auth" className="block">
            <div className="bg-card border border-border rounded-2xl p-4 text-center h-full">
              <ArrowRight className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-semibold text-foreground block">Log In</span>
              <span className="text-[11px] text-muted-foreground">Welcome back</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Safety Section */}
      <section className="px-5 pb-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Your Safety Matters
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: UserCheck,
              title: "ID Verified Profiles",
              desc: "Every user goes through identity verification. No fakes, no catfish.",
            },
            {
              icon: Lock,
              title: "Data Privacy",
              desc: "Your personal data is encrypted and never shared with third parties.",
            },
            {
              icon: Eye,
              title: "24/7 Moderation",
              desc: "Our team actively monitors the platform to keep the community safe.",
            },
            {
              icon: AlertTriangle,
              title: "Report & Block",
              desc: "Easily report or block anyone who makes you uncomfortable.",
            },
            {
              icon: MessageCircle,
              title: "Safe Messaging",
              desc: "Chat within the app. No phone numbers shared until you're ready.",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex gap-3.5 bg-card rounded-xl p-3.5 border border-border/50"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Safety Tips */}
      <section className="px-5 pb-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">Safety Tips</h2>
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
          {[
            "Never share financial information or send money",
            "Meet in public places for the first few dates",
            "Tell a friend where you're going",
            "Trust your instincts — if it feels off, leave",
            "Video call before meeting in person",
          ].map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
        <Link to="/safety" className="block mt-3">
          <Button variant="ghost" className="w-full text-primary text-sm font-medium">
            Read Full Safety Guide
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Community Guidelines */}
      <section className="px-5 pb-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-3">Community Guidelines</h2>
        <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
          <p className="text-sm text-foreground/80 leading-relaxed">
            Spaark is a space for respectful, genuine connections. We don't tolerate:
          </p>
          <ul className="text-sm text-foreground/70 space-y-1.5 ml-1">
            <li>• Harassment or bullying of any kind</li>
            <li>• Fake profiles or misleading info</li>
            <li>• Spam, scams, or promotional content</li>
            <li>• Hate speech or discrimination</li>
          </ul>
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-5 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Service" },
            { to: "/support", label: "Contact Support" },
            { to: "/faq", label: "FAQ" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="bg-card rounded-xl border border-border/50 p-3 text-center hover:bg-muted/50 transition-colors">
                <span className="text-xs font-medium text-muted-foreground">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-4 border-t border-border/30 text-center" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Spaark. Made with ❤️
        </p>
      </footer>
    </div>
  );
};

export default AppLanding;
