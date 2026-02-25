import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Sparkles, Shield, Lock, MessageCircle } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
import couple1 from "@/assets/couple-1.png";
import couple2 from "@/assets/couple-2.png";
import couple3 from "@/assets/couple-3.png";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const AppLanding = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[45vw] h-[45vw] rounded-full bg-secondary/12 blur-[90px]" />
      </div>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 liquid-glass-strong !rounded-none safe-area-pt">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-background/80 rounded-xl flex items-center justify-center shadow-sm">
              <img src={logo} alt="Spaark" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-lg font-display font-bold text-foreground">Spaark</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="rounded-full px-5 font-semibold text-sm shadow-md shadow-primary/20">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14 safe-area-pt" />

      {/* Hero Section with Image */}
      <section className="relative px-5 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Hero Image Collage */}
          <div className="relative w-full h-[280px] mb-6 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 grid grid-cols-2 gap-1.5">
              <div className="relative rounded-2xl overflow-hidden">
                <img src={couple1} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="relative flex-1 rounded-2xl overflow-hidden">
                  <img src={couple2} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                </div>
                <div className="relative flex-1 rounded-2xl overflow-hidden">
                  <img src={couple3} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                </div>
              </div>
            </div>
            {/* Floating badge on image */}
            <div className="absolute bottom-3 left-3 liquid-glass !rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-bold text-foreground">500+ Matches</span>
            </div>
          </div>

          <h1 className="font-display text-[28px] font-bold text-foreground leading-tight">
            Where Real Love
            <br />
            <span className="gradient-text">Begins</span> ✨
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-[280px]">
            Verified profiles. Genuine connections. Your story starts here.
          </p>
        </motion.div>
      </section>

      {/* CTA Buttons */}
      <section className="px-5 pb-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Link to="/auth" className="block">
            <Button className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25 gap-2">
              <Sparkles className="h-5 w-5" />
              Create Free Account
            </Button>
          </Link>
          <Link to="/auth" className="block">
            <Button variant="outline" className="w-full h-12 rounded-2xl text-sm font-semibold gap-2 liquid-glass !border-border/30">
              <ArrowRight className="h-4 w-4 text-primary" />
              I already have an account
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Trust Features - Horizontal Scroll */}
      <section className="px-5 pb-6 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {[
            { icon: Shield, title: "ID Verified", desc: "Real people only", color: "text-primary" },
            { icon: Lock, title: "Private & Safe", desc: "Your data is secure", color: "text-primary" },
            { icon: MessageCircle, title: "Chat First", desc: "No sharing numbers", color: "text-primary" },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="liquid-glass !rounded-2xl p-4 min-w-[140px] flex-shrink-0"
            >
              <item.icon className={`h-7 w-7 ${item.color} mb-2`} />
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Couple Stories Showcase */}
      <section className="px-5 pb-6 relative z-10">
        <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-primary fill-primary/30" />
          Love Stories
        </h2>
        <div className="space-y-3">
          {[
            { img: couple1, names: "Priya & Rahul", story: "Met on Spaark, married in 6 months! 💕" },
            { img: couple2, names: "Ananya & Vikram", story: "Found my best friend and soulmate here ❤️" },
          ].map((story, idx) => (
            <motion.div
              key={story.names}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.15 }}
              className="liquid-glass !rounded-2xl p-3 flex gap-3 items-center"
            >
              <img
                src={story.img}
                alt={story.names}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div>
                <p className="text-sm font-bold text-foreground">{story.names}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{story.story}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-5 pb-6 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: "/safety", label: "Safety" },
            { to: "/privacy", label: "Privacy" },
            { to: "/support", label: "Support" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="liquid-glass-subtle !rounded-xl p-3 text-center hover:border-primary/20 transition-colors">
                <span className="text-xs font-medium text-muted-foreground">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-5 py-4 text-center safe-area-pb">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Spaark · Made with ❤️ in India
        </p>
      </footer>
    </div>
  );
};

export default AppLanding;
