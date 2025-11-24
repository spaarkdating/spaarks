import { Button } from "@/components/ui/button";
import { Heart, Sparkles, MessageCircle, Shield, Zap, Users, Star, CheckCircle, TrendingUp, Video, Clock, MapPin, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Card } from "@/components/ui/card";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-[var(--gradient-glow)] pointer-events-none" />
      
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary animate-heartbeat" />
          <span className="text-xl md:text-2xl font-bold gradient-text">
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
            <Button variant="ghost" className="text-foreground hover:text-primary transition-colors">
              Log In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary via-primary-glow to-secondary hover:opacity-90 text-primary-foreground shadow-lg hover:shadow-[var(--shadow-soft)] transition-all">
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
      <section className="container mx-auto px-4 py-20 text-center relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div 
            className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full text-primary text-sm font-medium mb-4 border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            Find Your Perfect Match
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Ignite Your{" "}
            <span className="gradient-text animate-shimmer bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto]">
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
              <Button size="lg" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 transition-all card-hover">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 transition-all card-hover">
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-card border border-border">
            <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
              <Heart className="h-32 w-32 text-primary/30 fill-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20 relative">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            { number: "50K+", label: "Active Users" },
            { number: "15K+", label: "Matches Made" },
            { number: "95%", label: "Success Rate" },
            { number: "4.9★", label: "User Rating" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
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
              description: "Chat, video call, and plan your first date with your perfect match"
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
              <Card className="p-8 text-center hover:shadow-xl transition-all border-2 hover:border-primary/50 card-hover">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {item.step}
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
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
              icon: Video,
              title: "Video Dates",
              description: "Have virtual dates with your matches through integrated video calling before meeting in person.",
              color: "from-primary to-accent"
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
              <Card className="p-8 text-center hover:shadow-xl transition-all border hover:border-primary/50 card-hover h-full">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Success Stories</h2>
          <p className="text-xl text-muted-foreground">Real couples who found love on Spaark</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Sarah & Mike",
              story: "We matched on Spaark and instantly clicked! Now we're planning our wedding. Thank you for bringing us together!",
              time: "Matched 8 months ago",
              rating: 5
            },
            {
              name: "Emma & David",
              story: "I never thought I'd find someone who shares all my interests. Spaark's matching algorithm is incredible!",
              time: "Matched 1 year ago",
              rating: 5
            },
            {
              name: "Lisa & James",
              story: "The video date feature helped us connect before meeting. Now we're in a loving relationship!",
              time: "Matched 6 months ago",
              rating: 5
            }
          ].map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all border hover:border-primary/30 card-hover h-full">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">"{testimonial.story}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-background" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.time}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

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
                  <Video className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="font-semibold text-foreground">Spaark</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Spaark. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
