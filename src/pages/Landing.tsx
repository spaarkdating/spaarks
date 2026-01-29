import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, ChevronRight, X } from "lucide-react";
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
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
        .select(
          `
          id,
          story,
          match_duration,
          photo_url,
          user_profile:profiles!testimonials_user_id_fkey(display_name),
          partner_profile:profiles!testimonials_partner_id_fkey(display_name)
        `,
        )
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
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Wordmark style like Bumble */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Spaark" className="h-8 w-8 object-contain" />
            <span className="text-2xl font-display font-bold text-foreground">Spaark</span>
          </Link>

          {/* Center Nav - Pill container like Bumble */}
          <div className="hidden md:flex items-center bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-sm border border-border/30">
            {["About", "Safety", "Stories", "Support"].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase() === "stories" ? "testimonials" : item.toLowerCase()}`}
                className="px-5 py-2 text-foreground/80 hover:text-foreground font-medium transition-colors rounded-full hover:bg-muted/50"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link to="/auth" className="hidden sm:block">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 h-10 font-semibold">
                Sign in
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-10 w-10 rounded-full hover:bg-muted/50"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background p-0 [&>button]:hidden">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-5 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <img src={logo} alt="Spaark" className="h-7 w-7 object-contain" />
                      <span className="text-xl font-display font-bold text-foreground">Spaark</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="h-9 w-9 rounded-full hover:bg-muted"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Navigation Links - Clean list */}
                  <nav className="flex-1 py-4">
                    {[
                      { to: "/about", label: "About" },
                      { to: "/safety", label: "Safety" },
                      { to: "/testimonials", label: "Stories" },
                      { to: "/support", label: "Support" },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group"
                      >
                        <span className="text-base font-medium text-foreground">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </nav>
                  
                  {/* Footer - Sign in button */}
                  <div className="p-5 border-t border-border/30">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full h-12 font-semibold text-base">
                        Sign in
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>

      {/* Hero Section - Bumble-Inspired Design */}
      <section className="relative min-h-[100svh] overflow-hidden bg-gradient-to-b from-secondary/40 via-secondary/20 to-background">
        {/* Giant Brand Text - Bumble Style */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <motion.span 
            className="text-[28vw] sm:text-[22vw] font-display font-black text-foreground/[0.08] dark:text-foreground/[0.06] whitespace-nowrap tracking-tighter"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            Spaark
          </motion.span>
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 min-h-[100svh] flex flex-col">
          {/* Top spacing for navbar */}
          <div className="h-20" />
          
          {/* Cards Section - Center of screen */}
          <div className="flex-1 flex items-center justify-center px-4 py-8">
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Stacked Cards Container */}
              <div className="relative w-[260px] h-[360px] sm:w-[300px] sm:h-[420px] lg:w-[380px] lg:h-[520px]">
                {/* Background stacked cards */}
                {[2, 1].map((offset) => (
                  <motion.div
                    key={`stack-${offset}`}
                    className="absolute rounded-3xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-xl overflow-hidden"
                    style={{
                      width: '100%',
                      height: '100%',
                      right: `${offset * 20}px`,
                      top: `${offset * 12}px`,
                      zIndex: 3 - offset,
                    }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 0.6 - offset * 0.15 }}
                    transition={{ delay: 0.4 + offset * 0.1, duration: 0.5 }}
                  >
                    <img
                      src={profiles[(activeCard + offset) % profiles.length].image}
                      alt=""
                      className="w-full h-full object-cover opacity-70"
                    />
                  </motion.div>
                ))}

                {/* Main Active Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard}
                    className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20"
                    style={{ zIndex: 10 }}
                    initial={{ opacity: 0, x: 80, rotate: 5 }}
                    animate={{ opacity: 1, x: 0, rotate: 0 }}
                    exit={{ opacity: 0, x: -80, rotate: -5 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <img
                      src={profiles[activeCard].image}
                      alt={profiles[activeCard].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Profile Info */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-white font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                        {profiles[activeCard].name}, {profiles[activeCard].age}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profiles[activeCard].tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-white/25 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Dots */}
                    <div className="absolute bottom-6 right-6 flex gap-1.5">
                      {profiles.slice(0, 4).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === activeCard % 4 ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Card Navigation Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {profiles.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCard(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeCard
                        ? "bg-primary w-8"
                        : "bg-foreground/20 w-2 hover:bg-foreground/40"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Content - Tagline and CTA */}
          <motion.div
            className="px-4 pb-12 sm:pb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              We exist to bring people
              <br />
              <span className="text-primary">closer to love.</span>
            </h1>
            
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto">
              Find meaningful connections that ignite confidence and joy.
            </p>

            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all group">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">How Spaark works</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Simple, safe, and designed for real connections.
              </p>
            </div>
          </ScrollReveal>

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
              <ScrollReveal
                key={item.step}
                delay={idx * 0.15}
                className={"relative text-center " + (idx === 2 ? "col-span-2 md:col-span-1" : "")}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 relative">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-display text-base sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">{item.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">Why Spaark?</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { title: "Verified profiles", desc: "Every user is ID verified. No fakes, no catfish." },
              { title: "Quality matches", desc: "Our algorithm focuses on compatibility, not just looks." },
              { title: "Safe community", desc: "24/7 moderation keeps our community respectful." },
              { title: "Privacy first", desc: "Your data stays yours. We never sell your info." },
              { title: "Smart filters", desc: "Find exactly who you're looking for with detailed filters." },
              { title: "Real connections", desc: "Built for meaningful relationships, not endless swiping." },
            ].map((feature, idx) => (
              <ScrollReveal
                key={feature.title}
                delay={idx * 0.08}
                direction={idx % 2 === 0 ? "left" : "right"}
              >
                <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/50 h-full">
                  <h3 className="font-display text-sm sm:text-lg font-bold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Real Data */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 bg-card/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <ScrollReveal>
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Real love stories
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
                  Couples who found each other on Spaark.
                </p>
              </div>
            </ScrollReveal>

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
                            <h4 className="font-display text-base sm:text-lg font-bold text-foreground">
                              {coupleNames}
                            </h4>
                            {testimonial.match_duration && (
                              <span className="text-primary text-xs sm:text-sm font-medium">
                                {testimonial.match_duration}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed italic line-clamp-4">
                          "{testimonial.story}"
                        </p>
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
          <ScrollReveal>
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
          </ScrollReveal>
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
