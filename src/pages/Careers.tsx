import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Briefcase, Users, Zap, Coffee, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const Careers = () => {
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

      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Join Our Team</h1>
          <p className="text-xl text-muted-foreground">
            Help us create meaningful connections for millions
          </p>
        </div>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6">Why Work at Spaark?</h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Amazing Team</h3>
                <p className="text-sm text-muted-foreground">Work with passionate people who care about making a difference</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Innovation</h3>
                <p className="text-sm text-muted-foreground">Use cutting-edge technology to solve real problems</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Growth</h3>
                <p className="text-sm text-muted-foreground">Continuous learning and career development opportunities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">Open Positions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Senior Full Stack Developer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join our engineering team to build scalable features that help millions find love.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">TypeScript</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Supabase</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Full-time</span>
                </div>
                <Link to="/support">
                  <Button>Apply Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Product Designer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Design beautiful, intuitive experiences that make dating enjoyable and authentic.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">UI/UX</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Figma</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Full-time</span>
                </div>
                <Link to="/support">
                  <Button>Apply Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Customer Success Manager
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Help our users have the best experience and solve their challenges with empathy.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Support</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Communication</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Full-time</span>
                </div>
                <Link to="/support">
                  <Button>Apply Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented people. Send us your resume and let's talk!
            </p>
            <Link to="/support">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Get in Touch
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Careers;
