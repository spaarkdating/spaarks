import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Users, Sparkles, Check, ArrowRight, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/spaark-logo.png";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { ChatbotWidget } from "@/components/landing/ChatbotWidget";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";
import { PricingSection } from "@/components/landing/PricingSection";
import { SEO, JsonLd, getOrganizationSchema, getDatingServiceSchema } from "@/components/SEO";

// Real people photos
import person1 from "@/assets/person-1.jpg";
import person2 from "@/assets/person-2.jpg";
import person3 from "@/assets/person-3.jpg";
import person4 from "@/assets/person-4.jpg";
import person5 from "@/assets/person-5.jpg";
import person6 from "@/assets/person-6.jpg";

const Landing = () => {
  const [stats, setStats] = useState({ users: 0, matches: 0 });
  const [activeCard, setActiveCard] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profiles = [
    { name: "Anika", age: 24, image: person1, location: "Mumbai", verified: true },
    { name: "Rohan", age: 27, image: person2, location: "Delhi", verified: true },
    { name: "Maya", age: 25, image: person3, location: "Bangalore", verified: true },
    { name: "Arjun", age: 26, image: person4, location: "Pune", verified: true },
    { name: "Priya", age: 23, image: person5, location: "Hyderabad", verified: true },
    { name: "Vikram", age: 28, image: person6, location: "Chennai", verified: true },
  ];

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % profiles.length);
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

  return (
    <div className="min-h-screen bg-background font-body overflow-x-hidden">
      <SEO 
        title="Find Your Perfect Match"
        description="Discover meaningful connections on Spaark. Meet real people, have real conversations, find real love."
        canonicalUrl="/"
      />
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getDatingServiceSchema()} />
      
      <ChatbotWidget />
      
      {/* Floating Pill Navigation - Bumble Style */}
      <motion.header 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <nav className="bg-card/90 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-lg border border-border/50 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-full">
              <img src={logo} alt="Spaark" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-lg font-display font-bold text-foreground hidden sm:block">Spaark</span>
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/about-us">
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                About
              </Button>
            </Link>
            <Link to="/safety-tips">
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                Safety
              </Button>
            </Link>
            <Link to="/testimonials">
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                Stories
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                Support
              </Button>
            </Link>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="bumble" size="sm" className="rounded-full">
                Join Free
              </Button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 rounded-full hover:bg-muted/50 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden mt-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-2">
                <Link to="/about-us" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">About</Button>
                </Link>
                <Link to="/safety-tips" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">Safety</Button>
                </Link>
                <Link to="/testimonials" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">Stories</Button>
                </Link>
                <Link to="/support" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">Support</Button>
                </Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">Sign in</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section - Bumble Style with Stacked Cards */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50" />
        
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            {/* Left Content */}
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                <span>Real people, real connections</span>
              </motion.div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Make the first{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    move
                  </span>
                  <motion.svg 
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 100 10"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    <motion.path 
                      d="M0 8 Q 50 0, 100 8" 
                      fill="none" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </motion.svg>
                </span>
              </h1>
              
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                On Spaark, you're in control. Start conversations, make connections, 
                and meet people who are genuinely looking for what you are.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button variant="bumble" size="xl" className="w-full sm:w-auto group">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <motion.div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-8 mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-display font-bold text-foreground">{stats.users.toLocaleString()}+</p>
                  <p className="text-sm text-muted-foreground">Active members</p>
                </div>
                <div className="w-px h-12 bg-border hidden sm:block" />
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-display font-bold text-foreground">{stats.matches.toLocaleString()}+</p>
                  <p className="text-sm text-muted-foreground">Matches made</p>
                </div>
                <div className="w-px h-12 bg-border hidden sm:block" />
                <div className="text-center lg:text-left">
                  <p className="text-3xl font-display font-bold text-foreground">100%</p>
                  <p className="text-sm text-muted-foreground">Verified profiles</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Stacked Profile Cards */}
            <motion.div 
              className="flex-1 relative w-full max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative h-[450px] sm:h-[500px]">
                {/* Stacked Cards Background */}
                {profiles.slice(0, 3).map((_, index) => (
                  <motion.div
                    key={`bg-${index}`}
                    className="absolute inset-0 rounded-3xl bg-card border border-border/50 shadow-lg"
                    style={{
                      transform: `translateY(${(2 - index) * 8}px) scale(${1 - (2 - index) * 0.03})`,
                      zIndex: index,
                      opacity: 0.5 + index * 0.2,
                    }}
                  />
                ))}
                
                {/* Main Active Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-border/30"
                    initial={{ opacity: 0, scale: 1.05, rotateY: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -100 }}
                    transition={{ duration: 0.4 }}
                    style={{ zIndex: 10 }}
                  >
                    <img 
                      src={profiles[activeCard].image} 
                      alt={profiles[activeCard].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Profile Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-display text-2xl sm:text-3xl font-bold">
                          {profiles[activeCard].name}, {profiles[activeCard].age}
                        </h3>
                        {profiles[activeCard].verified && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-white/80 text-sm">{profiles[activeCard].location}</p>
                    </div>

                    {/* Swipe Buttons */}
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      <button className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                        <X className="w-6 h-6 text-muted-foreground" />
                      </button>
                      <button className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Card Indicators */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  {profiles.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCard(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeCard 
                          ? "bg-primary w-6" 
                          : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Bumble Style Steps */}
      <section className="py-20 sm:py-28 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              How Spaark works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Finding your person shouldn't be complicated. Here's how it works.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Users,
                title: "Create your profile",
                desc: "Upload your best photos, write a bio that shows who you really are, and set your preferences.",
              },
              {
                step: "02",
                icon: Heart,
                title: "Start connecting",
                desc: "Browse profiles, swipe right on people you like, and start conversations when you match.",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Meet your match",
                desc: "Take it offline! Meet up for coffee, dinner, or whatever feels right for you both.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="bg-card rounded-3xl p-8 h-full border border-border/50 hover:border-primary/30 transition-colors hover:shadow-lg">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Spaark - Feature Cards */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why choose Spaark?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're building a different kind of dating app. One where quality matters more than quantity.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Verified profiles only",
                desc: "Every profile is verified with ID. No catfish, no bots, just real people looking for real connections.",
                color: "bg-blue-500/10 text-blue-600",
              },
              {
                icon: Heart,
                title: "Quality over quantity",
                desc: "Our matching algorithm focuses on compatibility, not endless swiping. Fewer matches, better connections.",
                color: "bg-pink-500/10 text-pink-600",
              },
              {
                icon: Users,
                title: "Respectful community",
                desc: "Zero tolerance for harassment. Our moderation team works 24/7 to keep the community safe.",
                color: "bg-purple-500/10 text-purple-600",
              },
              {
                icon: Sparkles,
                title: "Smart compatibility",
                desc: "Our algorithm considers values, interests, and relationship goals—not just looks.",
                color: "bg-amber-500/10 text-amber-600",
              },
              {
                icon: Check,
                title: "Privacy first",
                desc: "Your data is yours. We never sell your information or show you to people you've passed on.",
                color: "bg-green-500/10 text-green-600",
              },
              {
                icon: ArrowRight,
                title: "Always improving",
                desc: "We listen to our users and constantly improve based on your feedback.",
                color: "bg-indigo-500/10 text-indigo-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Your next chapter starts here
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of people who've found meaningful connections on Spaark.
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="xl" className="rounded-full font-semibold">
                Create Your Profile
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Newsletter */}
      <NewsletterSignup />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
