import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Shield, Users, Star, Sparkles, ChevronRight, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { ChatbotWidget } from "@/components/landing/ChatbotWidget";
import { SEO, JsonLd, getOrganizationSchema, getDatingServiceSchema } from "@/components/SEO";

// Import couple images
import couple1 from "@/assets/couple-1.png";
import couple2 from "@/assets/couple-2.png";
import couple3 from "@/assets/couple-3.png";
import couple4 from "@/assets/couple-4.png";
import couple5 from "@/assets/couple-5.png";
import couple6 from "@/assets/couple-6.png";

const Landing = () => {
  const [stats, setStats] = useState({ users: 0, matches: 0 });
  const [currentCard, setCurrentCard] = useState(0);
  const cards = [
    { name: "Sarah", age: 24, image: couple1 },
    { name: "Emma", age: 26, image: couple2 },
    { name: "Sophie", age: 23, image: couple3 },
  ];

  const floatingImages = [
    { src: couple1, delay: 0, x: "5%", y: "15%" },
    { src: couple2, delay: 0.5, x: "80%", y: "10%" },
    { src: couple3, delay: 1, x: "10%", y: "60%" },
    { src: couple4, delay: 1.5, x: "85%", y: "55%" },
    { src: couple5, delay: 2, x: "25%", y: "85%" },
    { src: couple6, delay: 2.5, x: "70%", y: "80%" },
  ];

  const comparisonFeatures = [
    { feature: "Free to use", spaark: true, tinder: true, bumble: true, hinge: true },
    { feature: "Verified profiles", spaark: true, tinder: false, bumble: true, hinge: false },
    { feature: "ID verification", spaark: true, tinder: false, bumble: false, hinge: false },
    { feature: "Smart matching AI", spaark: true, tinder: true, bumble: true, hinge: true },
    { feature: "Unlimited swipes", spaark: true, tinder: false, bumble: false, hinge: false },
    { feature: "No hidden fees", spaark: true, tinder: false, bumble: false, hinge: false },
    { feature: "Real-time chat", spaark: true, tinder: true, bumble: true, hinge: true },
    { feature: "Profile boost", spaark: true, tinder: true, bumble: true, hinge: true },
    { feature: "See who liked you", spaark: true, tinder: false, bumble: false, hinge: false },
    { feature: "Icebreakers", spaark: true, tinder: false, bumble: true, hinge: true },
  ];

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      const { count: matchCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("is_match", true);
      setStats({ users: userCount || 0, matches: matchCount || 0 });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <SEO 
        title="Find Your Perfect Match"
        description="Discover meaningful connections on Spaark. Swipe, match, and chat with compatible singles in your area."
        canonicalUrl="/"
      />
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getDatingServiceSchema()} />
      
      <ChatbotWidget />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
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

      {/* Hero Section with Animated Floating Images */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden relative min-h-screen">
        {/* Animated Background with Floating Couple Images */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background z-10" />
          
          {/* Floating images */}
          {floatingImages.map((img, idx) => (
            <motion.div
              key={idx}
              className="absolute w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl opacity-40"
              style={{ left: img.x, top: img.y }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.05, 1],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 6,
                delay: img.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
          ))}
          
          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              className="text-center lg:text-left space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full text-sm text-primary"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                <span>Over {stats.users.toLocaleString()}+ active users</span>
              </motion.div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
                Swipe Right®
                <br />
                <span className="text-primary">Find Love</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                Join millions of singles discovering meaningful connections. Your next great love story starts with a single swipe.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold shadow-lg">
                    Get Started
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/testimonials">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary/30 text-foreground hover:bg-primary/10 rounded-full px-8 py-6 text-lg">
                    Success Stories
                  </Button>
                </Link>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Verified profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{stats.matches}+ matches</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Phone Mockup with Cards */}
            <motion.div 
              className="relative flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl rounded-full scale-75" />
              
              {/* Phone Frame */}
              <div className="relative w-72 sm:w-80 md:w-96">
                <div className="bg-card/90 backdrop-blur-sm rounded-[3rem] p-3 shadow-2xl border border-border/50">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="h-8 bg-card flex items-center justify-center">
                      <div className="w-20 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    
                    {/* Card Stack */}
                    <div className="relative h-[400px] sm:h-[450px] md:h-[500px] p-4">
                      {cards.map((card, index) => (
                        <motion.div
                          key={index}
                          className="absolute inset-4 rounded-3xl overflow-hidden shadow-xl"
                          initial={false}
                          animate={{
                            scale: index === currentCard ? 1 : 0.95 - (index - currentCard) * 0.05,
                            y: index === currentCard ? 0 : (index - currentCard) * 20,
                            opacity: index === currentCard ? 1 : 0.7,
                            zIndex: cards.length - Math.abs(index - currentCard),
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <img 
                            src={card.image} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-6 left-6 text-white">
                            <h3 className="text-2xl font-bold">{card.name}, {card.age}</h3>
                            <p className="text-white/80 text-sm">2 miles away</p>
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Action buttons overlay */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                        <motion.button 
                          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-destructive"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <span className="text-destructive text-2xl">✕</span>
                        </motion.button>
                        <motion.button 
                          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className="h-8 w-8 text-white fill-white" />
                        </motion.button>
                        <motion.button 
                          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-accent"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Star className="h-6 w-6 text-accent fill-accent" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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

      {/* Comparison Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Spaark Stands Out</h2>
            <p className="text-muted-foreground text-lg">See how we compare to other dating apps</p>
          </motion.div>

          <motion.div 
            className="max-w-4xl mx-auto overflow-x-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-foreground font-semibold">Features</th>
                  <th className="py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Spaark
                      </div>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-muted-foreground">Tinder</th>
                  <th className="py-4 px-4 text-muted-foreground">Bumble</th>
                  <th className="py-4 px-4 text-muted-foreground">Hinge</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <motion.tr 
                    key={idx}
                    className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <td className="py-4 px-4 text-foreground">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {row.spaark ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full">
                          <X className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.tinder ? (
                        <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.bumble ? (
                        <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.hinge ? (
                        <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
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
