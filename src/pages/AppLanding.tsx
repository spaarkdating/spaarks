import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, ArrowRight, Shield, Lock, MessageCircle, Users } from "lucide-react";
import logo from "@/assets/spaark-logo.png";
import person1 from "@/assets/person-1.jpg";
import person2 from "@/assets/person-2.jpg";
import person3 from "@/assets/person-3.jpg";
import person4 from "@/assets/person-4.jpg";
import person5 from "@/assets/person-5.jpg";
import person6 from "@/assets/person-6.jpg";
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const AppLanding = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState({ activeUsers: 0, totalMatches: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });

    // Fetch real stats
    supabase.rpc("get_public_stats").then(({ data }) => {
      if (data) {
        const d = data as { activeUsers: number; totalMatches: number };
        setStats({ activeUsers: d.activeUsers || 0, totalMatches: d.totalMatches || 0 });
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

  const profiles = [person1, person2, person3, person4, person5, person6];

  return (
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[45vw] h-[45vw] rounded-full bg-secondary/12 blur-[90px]" />
        <div className="absolute top-[40%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-accent/10 blur-[80px]" />
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
            <button className="liquid-glass !rounded-full px-5 py-2 text-sm font-semibold text-foreground border border-border/40 active:scale-95 transition-transform">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-14 safe-area-pt" />

      {/* Hero — Profile Grid */}
      <section className="relative px-5 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {/* Photo grid — real people */}
          <div className="relative w-full h-[260px] mb-5 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
              {profiles.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" loading={i < 3 ? "eager" : "lazy"} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                </motion.div>
              ))}
            </div>

            {/* Floating stat — real data */}
            {stats.activeUsers > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-3 left-3 liquid-glass !rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">{stats.activeUsers}+ Members</span>
              </motion.div>
            )}
            {stats.totalMatches > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute bottom-3 right-3 liquid-glass !rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-xs font-bold text-foreground">{stats.totalMatches}+ Matches</span>
              </motion.div>
            )}
          </div>

          <h1 className="font-display text-[28px] font-bold text-foreground leading-tight">
            Find Your
            <br />
            <span className="gradient-text">Perfect Match</span> ✨
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-[280px]">
            Verified profiles. Genuine connections.
          </p>
        </motion.div>
      </section>

      {/* CTA — iPhone Liquid Glass Buttons */}
      <section className="px-5 pb-5 pt-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Link to="/auth" className="block">
            <button className="w-full h-14 rounded-2xl text-base font-bold gap-2 flex items-center justify-center bg-primary text-primary-foreground shadow-lg active:scale-[0.97] transition-all duration-200"
              style={{ boxShadow: "0 8px 32px hsla(340, 62%, 26%, 0.35), inset 0 1px 0 hsla(0, 0%, 100%, 0.2)" }}
            >
              <Sparkles className="h-5 w-5" />
              Get Started Free
            </button>
          </Link>
          <Link to="/auth" className="block">
            <button className="w-full h-12 rounded-2xl text-sm font-semibold gap-2 flex items-center justify-center liquid-glass !border-border/40 border active:scale-[0.97] transition-all duration-200 text-foreground">
              <ArrowRight className="h-4 w-4 text-primary" />
              I already have an account
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Profile Showcase — Scrollable */}
      <section className="px-5 pb-5 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {[profile1, profile2, profile3].map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="liquid-glass !rounded-2xl p-1.5 min-w-[120px] flex-shrink-0"
            >
              <img
                src={src}
                alt=""
                className="w-full h-[140px] rounded-xl object-cover"
                loading="lazy"
              />
              <div className="flex items-center gap-1 mt-1.5 px-1">
                <div className="w-2 h-2 rounded-full bg-destructive" style={{ background: "hsl(142 71% 45%)" }} />
                <span className="text-[10px] text-muted-foreground font-medium">Online</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust — Compact */}
      <section className="px-5 pb-5 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {[
            { icon: Shield, title: "ID Verified", desc: "Real people only" },
            { icon: Lock, title: "Private & Safe", desc: "Data encrypted" },
            { icon: MessageCircle, title: "Chat First", desc: "No sharing numbers" },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="liquid-glass !rounded-2xl p-4 min-w-[130px] flex-shrink-0"
            >
              <item.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-5 pb-5 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          {[
            { to: "/safety", label: "Safety" },
            { to: "/privacy", label: "Privacy" },
            { to: "/support", label: "Support" },
          ].map((link) => (
            <Link key={link.to} to={link.to}>
              <div className="liquid-glass-subtle !rounded-xl p-3 text-center active:scale-95 transition-transform">
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
