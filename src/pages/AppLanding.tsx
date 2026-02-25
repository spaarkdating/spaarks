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
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      {/* Ambient background blobs for glass effect depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-accent/6 blur-[80px]" />
      </div>

      {/* Fixed Liquid Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 liquid-glass-strong" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-background/80 rounded-xl flex items-center justify-center shadow-sm">
              <img src={logo} alt="Spaark" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">Spaark</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 font-semibold text-sm shadow-md shadow-primary/20">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-14" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }} />

      {/* Hero */}
      <section className="relative px-5 pt-10 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-24 h-24 liquid-glass mx-auto mb-6 flex items-center justify-center !rounded-[2rem] shadow-lg">
            <Heart className="h-12 w-12 text-primary fill-primary/30" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3 leading-tight">
            Find Your <span className="gradient-text">Perfect Match</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Real connections with verified people. Safe, private, and designed for meaningful relationships.
          </p>

          {/* Stats - liquid glass cards */}
          <div className="flex justify-center gap-4 mt-6">
            {[
              { icon: Users, value: "1K+", label: "Users" },
              { icon: Heart, value: "500+", label: "Matches" },
              { icon: Star, value: "4.8", label: "Rating" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="liquid-glass-subtle !rounded-2xl px-4 py-3 text-center min-w-[80px]"
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
      <section className="px-5 pb-8 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/auth" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground rounded-2xl p-4 text-center shadow-lg shadow-primary/25 border border-primary-light/20"
            >
              <Sparkles className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-bold block">Sign Up Free</span>
              <span className="text-[11px] opacity-80">Start your journey</span>
            </motion.div>
          </Link>
          <Link to="/auth" className="block">
            <motion.div
              whileTap={{ scale: 0.97 }}
              className="liquid-glass !rounded-2xl p-4 text-center"
            >
              <ArrowRight className="h-6 w-6 mx-auto mb-2 text-primary" />
              <span className="text-sm font-bold text-foreground block">Log In</span>
              <span className="text-[11px] text-muted-foreground">Welcome back</span>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Safety Features */}
      <section className="px-5 pb-8 relative z-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-5 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Your Safety First
        </h2>
        <div className="space-y-3">
          {[
            { icon: UserCheck, title: "ID Verified Profiles", desc: "Every user is verified. No fakes, no catfish." },
            { icon: Lock, title: "Data Privacy", desc: "Your data is encrypted and never shared." },
            { icon: Eye, title: "24/7 Moderation", desc: "Active monitoring to keep the community safe." },
            { icon: AlertTriangle, title: "Report & Block", desc: "Easily report or block anyone instantly." },
            { icon: MessageCircle, title: "Safe Messaging", desc: "Chat in-app. Share numbers when you're ready." },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="liquid-glass flex gap-3.5 !rounded-2xl p-4"
            >
              <div className="w-11 h-11 liquid-glass-subtle !rounded-xl flex items-center justify-center flex-shrink-0">
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
      <section className="px-5 pb-8 relative z-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Safety Tips</h2>
        <div className="liquid-glass !rounded-2xl p-5 space-y-3">
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
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              </div>
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
      <section className="px-5 pb-8 relative z-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Community Guidelines</h2>
        <div className="liquid-glass !rounded-2xl p-5 space-y-2.5">
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
      <section className="px-5 pb-8 relative z-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Contact Us
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Have a question? We'd love to hear from you.</p>
        <form onSubmit={handleInquiry} className="liquid-glass-strong !rounded-2xl p-5 space-y-4">
          <Input
            placeholder="Your Name"
            value={inquiryForm.name}
            onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
            className="bg-background/40 border-border/30 focus:border-primary/50"
          />
          <Input
            type="email"
            placeholder="Your Email"
            value={inquiryForm.email}
            onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
            className="bg-background/40 border-border/30 focus:border-primary/50"
          />
          <Input
            placeholder="Subject"
            value={inquiryForm.subject}
            onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
            className="bg-background/40 border-border/30 focus:border-primary/50"
          />
          <Textarea
            placeholder="Your message..."
            value={inquiryForm.message}
            onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
            className="bg-background/40 border-border/30 focus:border-primary/50 min-h-[100px]"
          />
          <Button type="submit" className="w-full rounded-xl shadow-md shadow-primary/20" disabled={submitting}>
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
      <section className="px-5 pb-8 relative z-10">
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms of Service" },
            { to: "/support", label: "Support" },
            { to: "/faq", label: "FAQ" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="liquid-glass-subtle !rounded-xl p-3.5 text-center hover:border-primary/20 transition-colors">
                <span className="text-xs font-medium text-muted-foreground">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-5 py-5 border-t border-border/20 text-center liquid-glass-subtle !rounded-none" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.25rem)' }}>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Spaark. Made with ❤️ in India
        </p>
      </footer>
    </div>
  );
};

export default AppLanding;
