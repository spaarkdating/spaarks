import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Shield, Users, Star, Sparkles, ChevronRight, MapPin, Check, ArrowRight, Zap } from "lucide-react";
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
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);

  // Profile cards for the phone mockups
  const phoneProfiles = [
    { name: "Priya", age: 22, image: profile1, verified: true, location: "Mumbai", bio: "Coffee enthusiast. Book lover. Looking for genuine connections.", interests: ["Travel", "Photography", "Music"] },
    { name: "Rahul", age: 25, image: profile2, verified: true, location: "Delhi", bio: "Adventure seeker with a passion for cooking.", interests: ["Hiking", "Cooking", "Movies"] },
    { name: "Ananya", age: 24, image: profile3, verified: true, location: "Bangalore", bio: "Art lover. Chai over coffee. Dog mom.", interests: ["Art", "Yoga", "Reading"] },
    { name: "Arjun", age: 26, image: profile4, verified: false, location: "Pune", bio: "Fitness enthusiast. Netflix binger.", interests: ["Fitness", "Gaming", "Travel"] },
    { name: "Neha", age: 23, image: profile5, verified: true, location: "Hyderabad", bio: "Dance like nobody's watching. ✨", interests: ["Dance", "Fashion", "Food"] },
    { name: "Vikram", age: 27, image: profile6, verified: true, location: "Chennai", bio: "Tech geek. Music lover. Always curious.", interests: ["Technology", "Music", "Sports"] },
  ];

  useEffect(() => {
    fetchStats();
    fetchTestimonials();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProfileIndex((prev) => (prev + 1) % phoneProfiles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
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
    <div className="min-h-screen bg-background font-body">
      <SEO 
        title="Find Your Perfect Match"
        description="Discover meaningful connections on Spaark. Swipe, match, and chat with compatible singles in your area."
        canonicalUrl="/"
      />
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getDatingServiceSchema()} />
      
      <ChatbotWidget />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3 group cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="bg-card p-2 rounded-2xl shadow-md border border-border/50"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <img src={logo} alt="Spaark" className="h-8 w-8 object-contain" />
            </motion.div>
            <span className="text-xl font-display font-semibold text-foreground tracking-tight">Spaark</span>
          </motion.div>
          
          <motion.div 
            className="hidden md:flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="glow" size="default">
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
          
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section - Asymmetric Layout */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[80vh]">
            {/* Left Content */}
            <motion.div 
              className="order-2 lg:order-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Where real connections happen</span>
              </motion.div>
              
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Your story is{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent">
                    waiting
                  </span>
                  <motion.div 
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  />
                </span>
                {" "}to be written.
              </h1>
              
              <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Forget endless swiping. Spaark helps you find people who actually get you. 
                Real profiles, real conversations, real sparks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link to="/auth">
                  <Button variant="pill" size="xl" className="w-full sm:w-auto">
                    Start Your Journey
                    <Heart className="w-5 h-5 ml-2 fill-current" />
                  </Button>
                </Link>
                <Link to="/testimonials">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Read Success Stories
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">{stats.users.toLocaleString()}+ members</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                  </div>
                  <span className="font-medium">{stats.matches.toLocaleString()}+ matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">100% Verified</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Interactive Profile Preview */}
            <motion.div 
              className="order-1 lg:order-2 relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative max-w-sm mx-auto">
                {/* Decorative Elements */}
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-2xl" />
                
                {/* Profile Card */}
                <motion.div 
                  className="relative bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeProfileIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Profile Image */}
                      <div className="relative aspect-[3/4]">
                        <img 
                          src={phoneProfiles[activeProfileIndex].image} 
                          alt={phoneProfiles[activeProfileIndex].name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Profile Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-display text-2xl font-semibold">
                              {phoneProfiles[activeProfileIndex].name}, {phoneProfiles[activeProfileIndex].age}
                            </h3>
                            {phoneProfiles[activeProfileIndex].verified && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 text-white/80 text-sm mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{phoneProfiles[activeProfileIndex].location}</span>
                          </div>
                          
                          <p className="text-white/90 text-sm mb-4 line-clamp-2">
                            {phoneProfiles[activeProfileIndex].bio}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {phoneProfiles[activeProfileIndex].interests.map((interest, idx) => (
                              <span 
                                key={idx}
                                className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="absolute bottom-6 right-6 flex gap-3">
                    <motion.button 
                      className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-2xl">✕</span>
                    </motion.button>
                    <motion.button 
                      className="w-14 h-14 bg-gradient-to-r from-primary to-primary-light rounded-full shadow-lg flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className="w-6 h-6 text-white fill-white" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Profile Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {phoneProfiles.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveProfileIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeProfileIndex 
                          ? "bg-primary w-8" 
                          : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>

                {/* Small disclaimer */}
                <p className="text-center text-xs text-muted-foreground/60 mt-4">
                  Sample profiles for illustration only
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal Steps */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Three steps to your next chapter
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No complicated algorithms. No games. Just genuine connections made simple.
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />
            
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                { 
                  step: "01", 
                  icon: Users, 
                  title: "Be yourself", 
                  desc: "Create a profile that shows the real you. Share your story, your interests, what makes you tick." 
                },
                { 
                  step: "02", 
                  icon: Heart, 
                  title: "Find your match", 
                  desc: "Browse through profiles of people who share your values. When there's mutual interest, magic happens." 
                },
                { 
                  step: "03", 
                  icon: MessageCircle, 
                  title: "Start talking", 
                  desc: "Skip the small talk. Our conversation starters help you dive into meaningful discussions right away." 
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="relative text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <motion.div 
                    className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-2xl shadow-lg mb-6 mx-auto"
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  >
                    <item.icon className="w-8 h-8 text-primary-foreground" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-card border-2 border-primary rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {item.step}
                    </span>
                  </motion.div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Dating, but make it thoughtful
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've built the features that actually matter for finding lasting connections.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                icon: Shield, 
                title: "Safety first, always", 
                desc: "Every profile is verified. We take your safety seriously with ID verification and reporting tools.",
                gradient: "from-blue-500/10 to-cyan-500/10"
              },
              { 
                icon: Zap, 
                title: "Compatibility that clicks", 
                desc: "Our matching considers what actually matters - values, life goals, and what you're looking for.",
                gradient: "from-amber-500/10 to-orange-500/10"
              },
              { 
                icon: MessageCircle, 
                title: "Conversations that flow", 
                desc: "Real-time chat with icebreakers, voice messages, and reactions to keep things interesting.",
                gradient: "from-purple-500/10 to-pink-500/10"
              },
              { 
                icon: Star, 
                title: "Stand out when it counts", 
                desc: "Boost your profile visibility when you want to make an impression. Premium features for premium results.",
                gradient: "from-primary/10 to-accent/10"
              },
              { 
                icon: Users, 
                title: "A community that cares", 
                desc: "Join thousands of people who are tired of superficial dating and want something real.",
                gradient: "from-green-500/10 to-emerald-500/10"
              },
              { 
                icon: Heart, 
                title: "Made for lasting love", 
                desc: "Whether you're looking for friendship, romance, or your life partner - find your kind of connection.",
                gradient: "from-rose-500/10 to-red-500/10"
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className={`group relative bg-card border border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
                They found their person
              </h2>
              <p className="text-muted-foreground text-lg">Real stories from real couples who met on Spaark</p>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-border/50 bg-card/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(testimonials[currentTestimonialIndex]?.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <blockquote className="font-display text-xl md:text-2xl text-foreground italic text-center mb-8 leading-relaxed">
                        "{testimonials[currentTestimonialIndex]?.story}"
                      </blockquote>

                      <div className="flex items-center justify-center gap-4">
                        <div className="flex -space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light border-3 border-card" />
                          {testimonials[currentTestimonialIndex]?.partner && (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary border-3 border-card" />
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
                              Together for {testimonials[currentTestimonialIndex]?.match_duration}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonialIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentTestimonialIndex 
                          ? "bg-primary w-8" 
                          : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <motion.div 
              className="text-center mt-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Link to="/testimonials">
                <Button variant="magnetic" size="lg">
                  Read More Stories
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
      <section className="py-20 bg-muted/20">
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
      <section className="py-16 bg-background">
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

      {/* Final CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="relative bg-gradient-to-br from-primary via-primary-light to-accent rounded-[2rem] p-10 md:p-20 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Decorative circles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
              <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/20 rounded-full" />
              <div className="absolute top-1/2 left-1/4 w-20 h-20 border border-white/10 rounded-full" />
              <div className="absolute bottom-1/4 right-1/3 w-24 h-24 border border-white/10 rounded-full" />
            </div>
            
            <div className="relative z-10">
              <motion.h2 
                className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Your person is out there.
                <br />
                <span className="opacity-90">Let's find them together.</span>
              </motion.h2>
              <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join Spaark today and take the first step towards a connection that actually means something.
              </p>
              <Link to="/auth">
                <Button 
                  size="xl" 
                  className="bg-white text-primary hover:bg-white/90 rounded-full shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300"
                >
                  Create Your Free Profile
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
