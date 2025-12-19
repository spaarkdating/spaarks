import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Shield, Users, Star, Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/spaark-logo.png";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { ChatbotWidget } from "@/components/landing/ChatbotWidget";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";
import { InstallAppBanner } from "@/components/landing/InstallAppBanner";
import { PricingSection } from "@/components/landing/PricingSection";
import { SEO, JsonLd, getOrganizationSchema, getDatingServiceSchema } from "@/components/SEO";

// Import profile images for phone mockups
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";
import profile5 from "@/assets/profile-5.jpg";
import profile6 from "@/assets/profile-6.jpg";

const Landing = () => {
  const [stats, setStats] = useState({ users: 0, matches: 0 });
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Profile cards for the phone mockups - simulating real dating profiles
  const phoneProfiles = [
    { name: "Priya", age: 22, image: profile1, verified: true },
    { name: "Rahul", age: 25, image: profile2, verified: true },
    { name: "Ananya", age: 24, image: profile3, verified: true },
    { name: "Arjun", age: 26, image: profile4, verified: false },
    { name: "Neha", age: 23, image: profile5, verified: true },
    { name: "Vikram", age: 27, image: profile6, verified: true },
  ];

  useEffect(() => {
    fetchStats();
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

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

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select(`
          *,
          user:profiles!testimonials_user_id_fkey(display_name),
          partner:profiles!testimonials_partner_id_fkey(display_name)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
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
            className="flex items-center gap-2 group cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="bg-white/90 p-1.5 rounded-xl shadow-md"
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <img src={logo} alt="Spaark" className="h-8 w-8 object-contain" />
            </motion.div>
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

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, title: "Create Profile", desc: "Sign up and build your profile in minutes" },
              { icon: Heart, title: "Swipe & Match", desc: "Like profiles you're interested in" },
              { icon: MessageCircle, title: "Start Chatting", desc: "Message your matches and connect" },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="text-center p-2 sm:p-4 md:p-6"
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <motion.div 
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 md:mb-6 shadow-lg"
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <step.icon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" />
                </motion.div>
                <h3 className="text-xs sm:text-sm md:text-xl font-semibold text-foreground mb-1 sm:mb-2">{step.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-base text-muted-foreground leading-tight">{step.desc}</p>
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: "Safe & Verified", desc: "All profiles are verified for your safety" },
              { icon: Heart, title: "Smart Matching", desc: "AI-powered compatibility algorithm" },
              { icon: MessageCircle, title: "Real-time Chat", desc: "Instant messaging with your matches" },
              { icon: Star, title: "Premium Features", desc: "Boost your profile visibility" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.03, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              >
                <motion.div 
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-tight">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Success Stories</h2>
              <p className="text-muted-foreground text-lg">Real love stories from real people</p>
            </motion.div>

            {/* Testimonials Carousel */}
            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 md:p-12">
                      {/* Rating Stars */}
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(testimonials[currentTestimonialIndex]?.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-6 w-6 fill-primary text-primary" />
                        ))}
                      </div>

                      {/* Story */}
                      <p className="text-lg md:text-xl text-muted-foreground italic text-center mb-8 leading-relaxed">
                        "{testimonials[currentTestimonialIndex]?.story}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex -space-x-2">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background" />
                          {testimonials[currentTestimonialIndex]?.partner && (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-background" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">
                            {testimonials[currentTestimonialIndex]?.user?.display_name || "Anonymous"}
                            {testimonials[currentTestimonialIndex]?.partner?.display_name && 
                              ` & ${testimonials[currentTestimonialIndex]?.partner?.display_name}`}
                          </p>
                          {testimonials[currentTestimonialIndex]?.match_duration && (
                            <p className="text-sm text-muted-foreground">
                              {testimonials[currentTestimonialIndex]?.match_duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Dots Indicator */}
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonialIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentTestimonialIndex 
                          ? "bg-primary w-6" 
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* View All Link */}
            <motion.div 
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link to="/testimonials">
                <Button variant="outline" className="rounded-full">
                  View All Stories
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <PricingSection />

      {/* Newsletter Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <NewsletterSignup />
          </motion.div>
        </div>
      </section>

      {/* Install App Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <InstallAppBanner />
          </motion.div>
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
