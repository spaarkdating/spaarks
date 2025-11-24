import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, MessageCircle, Shield, Zap, Users, Star, CheckCircle, TrendingUp, Clock, MapPin, Award, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Card } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { NewsletterSignup } from "@/components/landing/NewsletterSignup";
import { RealTimeStats } from "@/components/landing/RealTimeStats";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax transforms for different sections
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const statsY = useTransform(scrollYProgress, [0.1, 0.4], [50, -50]);
  const featuresY = useTransform(scrollYProgress, [0.3, 0.6], [80, -80]);
  const testimonialsY = useTransform(scrollYProgress, [0.5, 0.8], [60, -60]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

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
        .limit(3);

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setIsLoadingTestimonials(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen overflow-hidden relative">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-muted to-background pointer-events-none animate-gradient" />
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, -200]) }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-glow/20 rounded-full blur-3xl"
          style={{ 
            y: useTransform(scrollYProgress, [0, 1], [0, -150]),
            x: useTransform(scrollYProgress, [0, 1], [0, 100]),
          }}
        />
      </div>
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary animate-heartbeat drop-shadow-lg" />
          <span className="text-xl md:text-2xl font-bold gradient-text-animated">
            Spaark
          </span>
        </motion.div>
        <motion.div 
          className="hidden md:flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link to="/auth">
            <Button variant="ghost" className="hover-lift hover:text-primary transition-all">
              Log In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary via-primary-glow to-accent button-hover hover:shadow-glow text-primary-foreground shadow-lg animate-gradient">
              Sign Up
            </Button>
          </Link>
        </motion.div>
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MobileNav />
        </motion.div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 text-center relative"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <AnimatedBackground />
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div 
            className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-primary text-sm font-medium mb-4 border border-primary/30 hover-glow animate-bounce-in"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-4 w-4 animate-pulse animate-glow" />
            Find Your Perfect Match
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Ignite Your{" "}
            <span className="gradient-text-animated bg-gradient-to-r from-primary via-accent to-primary-glow bg-[length:200%_auto]">
              Love Story
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover meaningful connections with people who share your interests and values. 
            Swipe, match, and chat your way to finding that special someone.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-gradient-to-r from-primary via-primary-glow to-accent button-hover animate-gradient hover:shadow-glow text-primary-foreground shadow-[var(--shadow-soft)] text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 transition-all">
                <Sparkles className="h-5 w-5 mr-2 animate-glow" />
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-lift text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 transition-all">
              Learn More
            </Button>
          </motion.div>
        </div>

      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 relative"
        style={{ y: statsY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <RealTimeStats />
        </motion.div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20"
        style={{ y: featuresY }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">Finding love is just 3 steps away</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: "1",
              icon: Users,
              title: "Create Your Profile",
              description: "Sign up and tell us about yourself, your interests, and what you're looking for"
            },
            {
              step: "2",
              icon: Heart,
              title: "Discover & Match",
              description: "Swipe through potential matches and connect with people who share your interests"
            },
            {
              step: "3",
              icon: MessageCircle,
              title: "Start Dating",
              description: "Chat with your matches and plan your first date with your perfect match"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.2 }}
            >
              <Card className="p-8 text-center hover:shadow-2xl transition-all border-2 hover:border-primary/50 card-hover hover-glow glass-effect group">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg animate-bounce-in">
                  {item.step}
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-8 w-8 text-primary animate-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="container mx-auto px-4 py-20"
        style={{ y: featuresY }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Premium Features</h2>
          <p className="text-xl text-muted-foreground">Everything you need to find your perfect match</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: Heart,
              title: "Smart Matching",
              description: "Our advanced algorithm finds compatible matches based on your interests, location, and preferences.",
              color: "from-primary to-secondary"
            },
            {
              icon: MessageCircle,
              title: "Instant Chat",
              description: "Connect instantly with your matches through our real-time messaging system with icebreakers.",
              color: "from-accent to-primary"
            },
            {
              icon: Shield,
              title: "Safe & Secure",
              description: "Verified profiles and secure authentication keep your dating experience safe and authentic.",
              color: "from-secondary to-accent"
            },
            {
              icon: MapPin,
              title: "Location-Based",
              description: "Find matches near you with customizable radius and distance filters for convenience.",
              color: "from-secondary to-primary"
            },
            {
              icon: Award,
              title: "Profile Verification",
              description: "Get verified with photo verification and earn a verified badge for increased trust.",
              color: "from-accent to-secondary"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="p-8 text-center hover:shadow-2xl transition-all border hover:border-primary/50 card-hover hover-glow h-full glass-effect group">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all animate-gradient`}>
                  <feature.icon className="h-8 w-8 text-white animate-glow" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="container mx-auto px-4 py-20"
        style={{ y: testimonialsY }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Success Stories</h2>
          <p className="text-xl text-muted-foreground">Real couples who found love on Spaark</p>
        </motion.div>

        {isLoadingTestimonials ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading success stories...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">No testimonials yet</p>
            <p className="text-sm text-muted-foreground">Be the first to share your success story!</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
              {testimonials.map((testimonial, idx) => {
                const displayName = testimonial.user?.display_name || "Anonymous";
                const partnerName = testimonial.partner?.display_name || "their match";
                const names = testimonial.partner ? `${displayName} & ${partnerName}` : displayName;
                
                return (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                  >
                    <Card className="p-6 hover:shadow-2xl transition-all border hover:border-primary/30 card-hover hover-glow h-full flex flex-col glass-effect group">
                      {/* Media Section */}
                      {(testimonial.photo_url || testimonial.video_url) && (
                        <div className="mb-4 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
                          {testimonial.video_url ? (
                            <video 
                              src={testimonial.video_url}
                              controls
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          ) : testimonial.photo_url && (
                            <img 
                              src={testimonial.photo_url}
                              alt="Testimonial"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary group-hover:scale-110 transition-transform animate-glow" style={{ transitionDelay: `${i * 50}ms` }} />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic flex-grow">"{testimonial.story}"</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <div className="flex -space-x-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background animate-gradient" />
                          {testimonial.partner && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-background animate-gradient" style={{ animationDelay: '2s' }} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{names}</p>
                          {testimonial.match_duration && (
                            <p className="text-xs text-muted-foreground">{testimonial.match_duration}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            <div className="text-center">
              <Link to="/testimonials">
                <Button variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground button-hover hover-lift">
                  View All Success Stories
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.section>


      {/* Trust Indicators */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl p-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, text: "SSL Encrypted" },
              { icon: CheckCircle, text: "Verified Profiles" },
              { icon: Users, text: "50K+ Members" },
              { icon: Award, text: "Award Winning" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium text-foreground">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div 
          className="bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10" />
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="h-12 w-12 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Find Your Spaark?</h2>
              <p className="text-lg md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of happy couples who found love on Spaark. Your perfect match is waiting!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-7 shadow-2xl card-hover">
                    <Heart className="h-5 w-5 mr-2" />
                    Create Your Profile
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-10 py-7">
                  <Heart className="h-5 w-5 mr-2" />
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Newsletter Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <NewsletterSignup />
        </motion.div>
      </section>


      <Footer />
    </div>
  );
};

export default Landing;
