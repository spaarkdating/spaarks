import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, AlertTriangle, Lock, Eye, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const SafetyTips = () => {
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
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4 gradient-text">Safety Tips</h1>
          <p className="text-xl text-muted-foreground">
            Your safety is our priority. Follow these guidelines for a secure dating experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Protect Your Personal Information</h3>
                  <p className="text-muted-foreground">
                    Never share your full name, address, phone number, or financial information until 
                    you've built trust. Keep conversations on the platform initially.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Watch for Red Flags</h3>
                  <p className="text-muted-foreground">
                    Be cautious of profiles asking for money, refusing to video chat, inconsistent stories, 
                    or pushing to move off the platform quickly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Meet in Public Places</h3>
                  <p className="text-muted-foreground">
                    Always choose public, well-lit locations for first meetings. Tell a friend or family 
                    member where you're going and when you expect to return.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Stay Sober and Alert</h3>
                  <p className="text-muted-foreground">
                    Avoid excessive alcohol on first dates. Keep your phone charged and have transportation 
                    arranged. Trust your instincts if something feels wrong.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-3xl font-bold mb-6">Online Safety Guidelines</h2>
            
            <section>
              <h3 className="text-xl font-semibold mb-3">Before Meeting in Person</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Get to know the person through messaging and video calls first</li>
                <li>Do a reverse image search on their photos to verify authenticity</li>
                <li>Check their social media presence to confirm their identity</li>
                <li>Trust your gut - if something feels off, it probably is</li>
                <li>Never feel pressured to meet before you're comfortable</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">During Your First Date</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Arrive and leave independently using your own transportation</li>
                <li>Share your live location with a trusted friend or family member</li>
                <li>Keep your phone charged and accessible</li>
                <li>Watch your drink at all times and don't leave it unattended</li>
                <li>Have a safety check-in call scheduled with someone</li>
                <li>If you feel uncomfortable, leave immediately</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Financial Safety</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Never send money to someone you've never met in person</li>
                <li>Be wary of sob stories or urgent financial requests</li>
                <li>Scammers often create fake emergencies to manipulate victims</li>
                <li>Legitimate romantic interests won't ask for financial help</li>
                <li>Report any requests for money to our support team immediately</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Reporting and Blocking</h3>
              <p className="text-muted-foreground mb-3">
                If you encounter suspicious behavior, harassment, or inappropriate content:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Use our reporting feature to flag the profile or conversation</li>
                <li>Block the user to prevent further contact</li>
                <li>Screenshot any evidence before blocking (if safe to do so)</li>
                <li>Contact our support team for serious safety concerns</li>
                <li>Report criminal activity to local law enforcement</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Need Help or Want to Report Something?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help. If you feel unsafe or notice suspicious activity, 
              please contact us immediately.
            </p>
            <Link to="/support">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Contact Support
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafetyTips;
