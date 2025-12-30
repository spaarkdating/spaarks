import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
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

interface Testimonial {
  id: string;
  story: string;
  match_duration: string | null;
  photo_url: string | null;
  user_profile?: { display_name: string | null };
  partner_profile?: { display_name: string | null };
}

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const profiles = [
    { name: "Max", age: 24, image: person1, tags: ["Outdoors", "Music", "Travel"] },
    { name: "Robin", age: 27, image: person2, tags: ["Fitness", "Cooking", "Movies"] },
    { name: "May", age: 25, image: person3, tags: ["Art", "Reading", "Yoga"] },
    { name: "Will", age: 26, image: person4, tags: ["Tech", "Gaming", "Sports"] },
    { name: "Nancy", age: 23, image: person5, tags: ["Dance", "Fashion", "Food"] },
    { name: "Steve", age: 28, image: person6, tags: ["Music", "Travel", "Photography"] },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % profiles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select(`
          id,
          story,
          match_duration,
          photo_url,
          user_profile:profiles!testimonials_user_id_fkey(display_name),
          partner_profile:profiles!testimonials_partner_id_fkey(display_name)
        `)
        .eq("status", "approved")
        .limit(6);
      
      if (data) setTestimonials(data as any);
    };
    fetchTestimonials();
  }, []);

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

      {/* Navigation - Bumble Style */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <nav className="max-w-7xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group justify-self-start">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <img src={logo} alt="Spaark" className="h-7 w-7 object-contain" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground hidden sm:block">Spaark</span>
          </Link>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center justify-center gap-8">
            <Link to="/about-us" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              About
            </Link>
            <Link to="/safety-tips" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              Safety
            </Link>
            <Link to="/testimonials" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              Stories
            </Link>
            <Link to="/support" className="text-foreground/80 hover:text-foreground font-medium transition-colors">
              Support
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 justify-self-end">
            <ThemeToggle />
            <Link to="/auth" className="hidden sm:block">
              <span className="text-foreground/80 hover:text-foreground font-medium transition-colors cursor-pointer">
                Sign in
              </span>
            </Link>
            <Link to="/auth" className="hidden sm:block">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 font-semibold">
                Join
              </Button>
            </Link>

            {/* Mobile Menu */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-full left-4 right-4 bg-card rounded-2xl shadow-xl border border-border mt-2 overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-4 space-y-3">
                <Link
                  to="/about-us"
                  className="block py-2 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/safety-tips"
                  className="block py-2 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Safety
                </Link>
                <Link
                  to="/testimonials"
                  className="block py-2 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Stories
                </Link>
                <Link
                  to="/support"
                  className="block py-2 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Support
                </Link>
                <Link
                  to="/auth"
                  className="block py-2 text-foreground font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section - Bumble Style with Watermark */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Giant Watermark Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="text-[20vw] sm:text-[25vw] font-display font-black text-primary/[0.07] whitespace-nowrap tracking-tight">
            Spaark
          </span>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
            {/* Left Content */}
            <motion.div
              className="text-center lg:text-left order-2 lg:order-1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground mb-6 leading-[0.95] tracking-tight">
                Make the
                <br />
                <span className="text-primary">first move</span>
              </h1>

              <p className="text-muted-foreground text-lg sm:text-xl mb-8 max-w-lg mx-auto lg:mx-0">
                Start something epic. Meet new people, build genuine connections, and find your person on Spaark.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth">
                  <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full h-14 px-8 text-lg font-semibold group">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right - 3D Stacked Profile Cards */}
            <motion.div
              className="relative order-1 lg:order-2 flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative w-[280px] sm:w-[320px] h-[420px] sm:h-[480px]" style={{ perspective: "1000px" }}>
                {/* Background Cards Stack */}
                {[2, 1, 0].map((offset) => (
                  <motion.div
                    key={`stack-${offset}`}
                    className="absolute inset-0 rounded-3xl bg-card border border-border shadow-xl"
                    style={{
                      transform: `translateX(${offset * 15}px) translateY(${offset * 10}px) rotateY(-5deg) rotateX(2deg)`,
                      zIndex: 3 - offset,
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 0.3 + 0.2 * (3 - offset), x: offset * 15 }}
                    transition={{ delay: 0.3 + offset * 0.1 }}
                  />
                ))}

                {/* Main Active Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                    style={{
                      transform: "rotateY(-5deg) rotateX(2deg)",
                      zIndex: 10,
                    }}
                    initial={{ opacity: 0, x: 100, rotateY: 10 }}
                    animate={{ opacity: 1, x: 0, rotateY: -5 }}
                    exit={{ opacity: 0, x: -100, rotateY: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <img
                      src={profiles[activeCard].image}
                      alt={profiles[activeCard].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Profile Info - Bottom Left */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white font-display text-3xl font-bold mb-1">
                        {profiles[activeCard].name}, {profiles[activeCard].age}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profiles[activeCard].tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Card Indicators */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                  {profiles.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCard(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === activeCard
                          ? "bg-primary w-8"
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

      {/* How It Works */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">How Spaark works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Simple, safe, and designed for real connections.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Create your profile",
                desc: "Add your photos, write your bio, and show the world who you really are.",
              },
              {
                step: "02",
                title: "Find your people",
                desc: "Swipe, match, and start conversations with people who get you.",
              },
              {
                step: "03",
                title: "Make it real",
                desc: "Take it offline. Meet up, connect, and see where it goes.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                className={
                  "relative text-center " +
                  (idx === 2 ? "col-span-2 md:col-span-1" : "")
                }
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 relative">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-display text-base sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Why Spaark?</h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { title: "Verified profiles", desc: "Every user is ID verified. No fakes, no catfish." },
              { title: "Quality matches", desc: "Our algorithm focuses on compatibility, not just looks." },
              { title: "Safe community", desc: "24/7 moderation keeps our community respectful." },
              { title: "Privacy first", desc: "Your data stays yours. We never sell your info." },
              { title: "Smart filters", desc: "Find exactly who you're looking for with detailed filters." },
              { title: "Real connections", desc: "Built for meaningful relationships, not endless swiping." },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-4 sm:p-5 border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <h3 className="font-display text-sm sm:text-lg font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Real Data */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 bg-card/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-10 sm:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">Real love stories</h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">Couples who found each other on Spaark.</p>
            </motion.div>

            <div className="relative">
              <motion.div
                className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-4 -mx-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                {testimonials.map((testimonial, idx) => {
                  const userName = (testimonial.user_profile as any)?.display_name || "Anonymous";
                  const partnerName = (testimonial.partner_profile as any)?.display_name;
                  const coupleNames = partnerName ? `${userName} & ${partnerName}` : userName;
                  
                  return (
                    <motion.div
                      key={testimonial.id}
                      className="flex-shrink-0 w-[280px] sm:w-[350px] snap-center"
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="bg-card rounded-3xl p-5 sm:p-6 border border-border h-full">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                          {testimonial.photo_url ? (
                            <img
                              src={testimonial.photo_url}
                              alt={coupleNames}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-primary/20"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/20">
                              <span className="text-lg sm:text-xl font-bold text-primary">{userName.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-display text-base sm:text-lg font-bold text-foreground">{coupleNames}</h4>
                            {testimonial.match_duration && (
                              <span className="text-primary text-xs sm:text-sm font-medium">{testimonial.match_duration}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed italic line-clamp-4">"{testimonial.story}"</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Scroll Hint */}
              <div className="flex justify-center mt-4 gap-2">
                <div className="h-1 w-16 bg-primary/30 rounded-full">
                  <div className="h-1 w-8 bg-primary rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-6">
              Ready to find your person?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Join thousands who've found real connections on Spaark.
            </p>
            <Link to="/auth">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full h-14 px-10 text-lg font-semibold">
                Create Profile
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
