import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Heart, UserCheck, Lock, Eye, MessageCircle, ArrowRight, AlertTriangle, CheckCircle2, Send, Mail, Sparkles, Star, Users } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AppLanding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect logged-in users to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.subject || !inquiryForm.message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("contact_inquiries").insert({
        name: inquiryForm.name,
        email: inquiryForm.email,
        subject: inquiryForm.subject,
        message: inquiryForm.message,
        status: "open",
      });
      if (error) throw error;
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setInquiryForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({ title: "Failed to send", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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

      {/* Spacer for fixed header */}
      <div className="h-14" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />

      {/* Hero */}
      <section className="relative px-5 pt-10 pb-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <Heart className="h-12 w-12 text-primary fill-primary/30" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3 leading-tight">
            Find Your <span className="text-primary">Perfect Match</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Real connections with verified people. Safe, private, and designed for meaningful relationships.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-6 mt-6">
            {[
              { icon: Users, value: "1K+", label: "Users" },
              { icon: Heart, value: "500+", label: "Matches" },
              { icon: Star, value: "4.8", label: "Rating" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <stat.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Buttons */}
      <section className="px-5 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/auth" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-br from-primary to-pink-600 text-primary-foreground rounded-2xl p-4 text-center shadow-lg shadow-primary/20"
            >
              <Sparkles className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-bold block">Sign Up Free</span>
              <span className="text-[11px] opacity-80">Start your journey</span>
            </motion.div>
          </Link>
          <Link to="/auth" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-card border-2 border-primary/20 rounded-2xl p-4 text-center"
            >
              <ArrowRight className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-bold text-foreground block">Log In</span>
              <span className="text-[11px] text-muted-foreground">Welcome back</span>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Safety Features */}
      <section className="px-5 pb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Your Safety First
        </h2>
        <div className="space-y-3">
          {[
            { icon: UserCheck, title: "ID Verified Profiles", desc: "Every user is verified. No fakes, no catfish.", color: "from-emerald-500/10 to-green-500/10" },
            { icon: Lock, title: "Data Privacy", desc: "Your data is encrypted and never shared.", color: "from-blue-500/10 to-indigo-500/10" },
            { icon: Eye, title: "24/7 Moderation", desc: "Active monitoring to keep the community safe.", color: "from-purple-500/10 to-violet-500/10" },
            { icon: AlertTriangle, title: "Report & Block", desc: "Easily report or block anyone instantly.", color: "from-amber-500/10 to-orange-500/10" },
            { icon: MessageCircle, title: "Safe Messaging", desc: "Chat in-app. Share numbers when you're ready.", color: "from-pink-500/10 to-rose-500/10" },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex gap-3.5 bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
            >
              <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Safety Tips */}
      <section className="px-5 pb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Safety Tips</h2>
        <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl border border-border/50 p-5 space-y-3 shadow-sm">
          {[
            "Never share financial information or send money",
            "Meet in public places for the first few dates",
            "Tell a friend where you're going",
            "Trust your instincts — if it feels off, leave",
            "Video call before meeting in person",
          ].map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + idx * 0.05 }}
              className="flex items-start gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 leading-relaxed">{tip}</p>
            </motion.div>
          ))}
        </div>
        <Link to="/safety" className="block mt-3">
          <Button variant="ghost" className="w-full text-primary text-sm font-semibold">
            Read Full Safety Guide <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </section>

      {/* Community Guidelines */}
      <section className="px-5 pb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Community Guidelines</h2>
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 space-y-2.5 border border-primary/10">
          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
            Spaark is a space for respectful, genuine connections:
          </p>
          <ul className="text-sm text-foreground/70 space-y-2 ml-1">
            {[
              "No harassment or bullying of any kind",
              "No fake profiles or misleading info",
              "No spam, scams, or promotional content",
              "No hate speech or discrimination",
            ].map((rule) => (
              <li key={rule} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact / Enquiry Form */}
      <section className="px-5 pb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Contact Us
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Have a question? We'd love to hear from you.</p>
        <form onSubmit={handleInquiry} className="bg-card rounded-2xl border border-border/50 p-5 space-y-4 shadow-sm">
          <Input
            placeholder="Your Name"
            value={inquiryForm.name}
            onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
            className="bg-background/50"
          />
          <Input
            type="email"
            placeholder="Your Email"
            value={inquiryForm.email}
            onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
            className="bg-background/50"
          />
          <Input
            placeholder="Subject"
            value={inquiryForm.subject}
            onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
            className="bg-background/50"
          />
          <Textarea
            placeholder="Your message..."
            value={inquiryForm.message}
            onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
            className="bg-background/50 min-h-[100px]"
          />
          <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
            {submitting ? "Sending..." : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
          <Link to="/inquiry-status" className="block">
            <Button variant="ghost" type="button" className="w-full text-xs text-muted-foreground">
              Already sent an inquiry? Check status →
            </Button>
          </Link>
        </form>
      </section>

      {/* Quick Links */}
      <section className="px-5 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Service" },
            { to: "/support", label: "Support" },
            { to: "/faq", label: "FAQ" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="bg-card rounded-xl border border-border/50 p-3.5 text-center hover:bg-muted/50 transition-colors">
                <span className="text-xs font-medium text-muted-foreground">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-5 border-t border-border/30 text-center bg-card/50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.25rem)' }}>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Spaark. Made with ❤️ in India
        </p>
      </footer>
    </div>
  );
};

export default AppLanding;
