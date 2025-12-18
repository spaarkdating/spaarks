import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Shield, Users, Star, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { ChatbotWidget } from "@/components/landing/ChatbotWidget";
import { SEO, JsonLd, getOrganizationSchema, getDatingServiceSchema } from "@/components/SEO";

// Import couple images for phone mockups
import couple1 from "@/assets/couple-1.png";
import couple2 from "@/assets/couple-2.png";
import couple3 from "@/assets/couple-3.png";
import couple4 from "@/assets/couple-4.png";
import couple5 from "@/assets/couple-5.png";
import couple6 from "@/assets/couple-6.png";

const Landing = () => {
  const [stats, setStats] = useState({ users: 0, matches: 0 });

  // Profile cards for the phone mockups - simulating real dating profiles
  const phoneProfiles = [
    { name: "Priya", age: 23, image: couple1, verified: true },
    { name: "Rahul", age: 25, image: couple2, verified: true },
    { name: "Ananya", age: 22, image: couple3, verified: true },
    { name: "Arjun", age: 26, image: couple4, verified: false },
    { name: "Neha", age: 24, image: couple5, verified: true },
    { name: "Vikram", age: 27, image: couple6, verified: true },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Use the get_public_stats RPC function to get real stats
      const { data, error } = await supabase.rpc('get_public_stats');
      if (error) throw error;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const statsData = data as { activeUsers?: number; totalMatches?: number };
        setStats({ 
          users: statsData.activeUsers || 0, 
          matches: statsData.totalMatches || 0 
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Find Your Perfect Match"
        description="Discover meaningful connections on Spaark. Swipe, match, and chat with compatible singles in your area."
        canonicalUrl="/"
      />
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getDatingServiceSchema()} />
      
      <ChatbotWidget />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white/90 p-1.5 rounded-xl shadow-md">
              <img src={logo} alt="Spaark" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">Spaark</span>
          </motion.div>
          
          <motion.div 
            className="hidden md:flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                Create account
              </Button>
            </Link>
          </motion.div>
          
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section - Tinder Style with Phone Mockups */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-card to-background">
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-background/60 z-10" />
        
        {/* Phone Mockup Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="relative w-full h-full">
            {/* Row 1 - Top phones (tilted) */}
            {phoneProfiles.slice(0, 3).map((profile, idx) => (
              <motion.div
                key={`top-${idx}`}
                className="absolute"
                style={{
                  left: `${15 + idx * 30}%`,
                  top: '5%',
                  transform: `rotate(${-15 + idx * 8}deg)`,
                }}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
              >
                <div className="w-40 sm:w-48 md:w-56 lg:w-64 bg-card rounded-[2rem] p-2 shadow-2xl border border-border/30">
                  <div className="bg-background rounded-[1.5rem] overflow-hidden">
                    <div className="relative aspect-[3/4]">
                      <img 
                        src={profile.image} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm">{profile.name}</span>
                          <span className="text-sm">{profile.age}</span>
                          {profile.verified && (
                            <span className="text-blue-400 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                      {/* Swipe buttons */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs">
                          <span className="text-red-500">✕</span>
                        </div>
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Row 2 - Bottom phones (tilted opposite) */}
            {phoneProfiles.slice(3, 6).map((profile, idx) => (
              <motion.div
                key={`bottom-${idx}`}
                className="absolute"
                style={{
                  left: `${5 + idx * 35}%`,
                  bottom: '10%',
                  transform: `rotate(${10 - idx * 6}deg)`,
                }}
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.15, duration: 0.8 }}
              >
                <div className="w-40 sm:w-48 md:w-56 lg:w-64 bg-card rounded-[2rem] p-2 shadow-2xl border border-border/30">
                  <div className="bg-background rounded-[1.5rem] overflow-hidden">
                    <div className="relative aspect-[3/4]">
                      <img 
                        src={profile.image} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-sm">{profile.name}</span>
                          <span className="text-sm">{profile.age}</span>
                          {profile.verified && (
                            <span className="text-blue-400 text-xs">✓</span>
                          )}
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-xs">
                          <span className="text-red-500">✕</span>
                        </div>
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Start something
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">epic.</span>
          </motion.h1>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-full px-10 py-6 text-lg font-semibold shadow-xl"
              >
                Create account
              </Button>
            </Link>
          </motion.div>

          {/* Stats badge */}
          <motion.div 
            className="flex items-center gap-6 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm">{stats.users.toLocaleString()}+ active users</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm">{stats.matches.toLocaleString()}+ matches made</span>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.p 
            className="absolute bottom-4 text-xs text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            All photos are of models and used for illustrative purposes only
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How Spaark Works</h2>
            <p className="text-muted-foreground text-lg">Finding your match is easy</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, title: "Create Profile", desc: "Sign up and build your profile in minutes" },
              { icon: Heart, title: "Swipe & Match", desc: "Like profiles you're interested in" },
              { icon: MessageCircle, title: "Start Chatting", desc: "Message your matches and connect" },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="text-center p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Spaark?</h2>
            <p className="text-muted-foreground text-lg">Features designed for real connections</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: "Safe & Verified", desc: "All profiles are verified for your safety" },
              { icon: Heart, title: "Smart Matching", desc: "AI-powered compatibility algorithm" },
              { icon: MessageCircle, title: "Real-time Chat", desc: "Instant messaging with your matches" },
              { icon: Star, title: "Premium Features", desc: "Boost your profile visibility" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white rounded-full" />
              <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Find Love?
              </h2>
              <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                Join thousands of singles who found their perfect match on Spaark
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-lg font-semibold shadow-xl">
                  Start Swiping Now
                  <Heart className="ml-2 h-5 w-5 fill-primary" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
