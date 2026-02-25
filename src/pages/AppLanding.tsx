import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Heart, Lock, MessageCircle, Shield, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";
import person1 from "@/assets/person-1.jpg";
import person2 from "@/assets/person-2.jpg";
import person3 from "@/assets/person-3.jpg";
import person4 from "@/assets/person-4.jpg";
import person5 from "@/assets/person-5.jpg";
import person6 from "@/assets/person-6.jpg";
import { supabase } from "@/integrations/supabase/client";

type PublicStats = {
  activeUsers?: number;
  totalMatches?: number;
};

type LandingStory = {
  id: string;
  story: string;
  photoUrl: string | null;
  name: string;
};

const fallbackProfiles = [person1, person2, person3, person4, person5, person6];

const AppLanding = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState({ activeUsers: 0, totalMatches: 0 });
  const [heroPhotos, setHeroPhotos] = useState<string[]>(fallbackProfiles);
  const [stories, setStories] = useState<LandingStory[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadLandingData = async () => {
      try {
        const [sessionResult, statsResult, photosResult, storiesResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.rpc("get_public_stats"),
          supabase
            .from("photos")
            .select("photo_url")
            .order("created_at", { ascending: false })
            .limit(9),
          supabase
            .from("testimonials")
            .select("id, story, photo_url, user:profiles!testimonials_user_id_fkey(display_name)")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        if (!isMounted) return;

        if (sessionResult.data.session) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const publicStats = statsResult.data as PublicStats | null;
        if (publicStats) {
          setStats({
            activeUsers: Number(publicStats.activeUsers ?? 0),
            totalMatches: Number(publicStats.totalMatches ?? 0),
          });
        }

        const livePhotos = (photosResult.data ?? [])
          .map((item) => item.photo_url)
          .filter((url): url is string => Boolean(url));

        if (livePhotos.length > 0) {
          setHeroPhotos([...livePhotos, ...fallbackProfiles].slice(0, 6));
        }

        const liveStories: LandingStory[] = (storiesResult.data ?? [])
          .filter((item) => Boolean(item.story))
          .map((item) => ({
            id: item.id,
            story: item.story,
            photoUrl: item.photo_url,
            name: item.user?.display_name?.trim() || "Verified member",
          }));

        setStories(liveStories);
      } catch (error) {
        console.error("Failed to load landing data", error);
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    loadLandingData();

    return () => {
      isMounted = false;
    };
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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-8%] w-[45vw] h-[45vw] rounded-full bg-secondary/12 blur-[90px]" />
        <div className="absolute top-[40%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 liquid-glass-strong !rounded-none safe-area-pt">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-background/80 rounded-xl flex items-center justify-center shadow-sm">
              <img src={logo} alt="Spaark logo" className="h-6 w-6 object-contain" />
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

      <div className="h-14 safe-area-pt" />

      <section className="relative px-5 pt-6 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="relative w-full h-[260px] mb-5 overflow-hidden rounded-3xl">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
              {heroPhotos.map((src, i) => (
                <motion.div
                  key={`${src}-${i}`}
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <img
                    src={src}
                    alt={`Spaark member profile ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
                </motion.div>
              ))}
            </div>

            {stats.activeUsers > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="absolute bottom-3 left-3 liquid-glass !rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">{stats.activeUsers}+ Active Members</span>
              </motion.div>
            )}

            {stats.totalMatches > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="absolute bottom-3 right-3 liquid-glass !rounded-full px-3 py-1.5 flex items-center gap-1.5"
              >
                <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-xs font-bold text-foreground">{stats.totalMatches}+ Real Matches</span>
              </motion.div>
            )}
          </div>

          <h1 className="font-display text-[28px] font-bold text-foreground leading-tight">
            Find Your
            <br />
            <span className="gradient-text">Perfect Match</span> ✨
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-[300px]">
            Real profiles. Verified users. Real conversations.
          </p>
        </motion.div>
      </section>

      <section className="px-5 pb-5 pt-3 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Link to="/auth" className="block">
            <button className="group relative isolate w-full h-14 overflow-hidden rounded-2xl liquid-glass-strong border border-primary/35 text-foreground shadow-[0_12px_40px_hsl(var(--primary)/0.32)] active:scale-[0.98] transition-transform duration-200">
              {!shouldReduceMotion && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                  animate={{ x: ["0%", "380%"] }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 text-base font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                Create Free Account
              </span>
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

      <section className="px-5 pb-5 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {heroPhotos.slice(0, 6).map((src, idx) => (
            <motion.div
              key={`${src}-strip-${idx}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 + idx * 0.08 }}
              className="liquid-glass !rounded-2xl p-1.5 min-w-[120px] flex-shrink-0"
            >
              <img
                src={src}
                alt={`Online member ${idx + 1}`}
                className="w-full h-[140px] rounded-xl object-cover"
                loading="lazy"
              />
              <div className="flex items-center gap-1 mt-1.5 px-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground font-medium">Active now</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-5 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {[
            { icon: Shield, title: "ID Verified", desc: "Real people only" },
            { icon: Lock, title: "Private & Safe", desc: "Data encrypted" },
            { icon: MessageCircle, title: "Chat First", desc: "No shared numbers" },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42 + idx * 0.08 }}
              className="liquid-glass !rounded-2xl p-4 min-w-[130px] flex-shrink-0"
            >
              <item.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {stories.length > 0 && (
        <section className="px-5 pb-5 relative z-10">
          <h2 className="font-display text-xl font-bold text-foreground mb-3">Real Stories</h2>
          <div className="space-y-3">
            {stories.map((story, idx) => (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                className="liquid-glass-subtle !rounded-2xl p-3 flex items-start gap-3"
              >
                <img
                  src={story.photoUrl || heroPhotos[idx]}
                  alt={`${story.name} testimonial photo`}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{story.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {story.story.length > 120 ? `${story.story.slice(0, 120)}…` : story.story}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      )}

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

      <footer className="relative z-10 px-5 py-4 text-center safe-area-pb">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Spaark · Made with ❤️ in India</p>
      </footer>
    </div>
  );
};

export default AppLanding;

