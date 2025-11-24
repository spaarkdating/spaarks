import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Target, Sparkles, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <span className="text-2xl font-bold gradient-text">Spaark</span>
        </Link>
        <Link to="/">
          <Button variant="ghost">Back to Home</Button>
        </Link>
      </header>

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">About Spaark</h1>
          <p className="text-xl text-muted-foreground">
            Connecting hearts, creating meaningful relationships
          </p>
        </div>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              At Spaark, we believe that everyone deserves to find meaningful connections and lasting love. 
              Our mission is to create a safe, authentic, and engaging platform where people can discover 
              compatible matches based on shared interests, values, and life goals.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're committed to fostering genuine relationships by combining innovative technology with 
              human-centered design, ensuring that every interaction on our platform brings people closer 
              to finding their perfect match.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Spaark was founded with a simple yet powerful vision: to revolutionize online dating by 
              creating a platform that prioritizes authenticity, safety, and meaningful connections over 
              superficial interactions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              We've built a community where users can be themselves, express their true interests, and 
              connect with like-minded individuals who share their values and relationship goals. Every 
              feature we develop is designed with one purpose in mind: helping people find genuine love 
              and companionship.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Today, Spaark continues to grow as a trusted platform for singles seeking meaningful 
              relationships, with thousands of success stories and counting.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Our Team
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Founders</h3>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">SS</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-1">Sourabh Sharma</h4>
                      <p className="text-muted-foreground text-center">Co-Founder</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">AS</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-1">Aakanksha Singh</h4>
                      <p className="text-muted-foreground text-center">Co-Founder</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-2">Development Team</h3>
                <Card className="mt-4">
                  <CardContent className="p-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">MS</span>
                    </div>
                    <h4 className="text-xl font-bold text-center mb-1">Mandhata Singh</h4>
                    <p className="text-muted-foreground text-center">Lead Developer</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions or want to learn more about Spaark?
            </p>
            <Link to="/support">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Contact Us
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
