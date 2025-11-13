import { Button } from "@/components/ui/button";
import { Heart, Sparkles, MessageCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Spaark
          </span>
        </div>
        <div className="flex gap-3">
          <Link to="/auth">
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Log In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-lg">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Find Your Perfect Match
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Ignite Your{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Love Story
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover meaningful connections with people who share your interests and values. 
            Swipe, match, and chat your way to finding that special someone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-lg text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary/5 text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Choose Spaark?</h2>
          <p className="text-xl text-muted-foreground">Everything you need to find your perfect match</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Matching</h3>
            <p className="text-muted-foreground">
              Our algorithm finds compatible matches based on your interests, location, and preferences.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Instant Chat</h3>
            <p className="text-muted-foreground">
              Connect instantly with your matches through our real-time messaging system.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow border border-border">
            <div className="w-16 h-16 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
            <p className="text-muted-foreground">
              Verified profiles and secure authentication keep your dating experience safe.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary via-accent to-secondary rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Your Spaark?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of happy couples who found love on Spaark</p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
              Create Your Profile
            </Button>
          </Link>
        </div>
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
