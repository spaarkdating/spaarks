import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
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
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4 gradient-text">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November 2024</p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Spaark, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our platform. These terms apply to 
                all visitors, users, and others who access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                You must be at least 18 years old to use Spaark. By creating an account, you represent 
                and warrant that you meet this age requirement and have the legal capacity to enter into 
                these terms. We reserve the right to terminate accounts that violate this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of unauthorized account access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Harass, abuse, or harm other users</li>
                <li>Upload false, misleading, or inappropriate content</li>
                <li>Impersonate any person or entity</li>
                <li>Use the platform for commercial purposes without permission</li>
                <li>Collect information about other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to hack or disrupt the platform</li>
                <li>Create multiple accounts to circumvent restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Content Guidelines</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content you upload must be appropriate and respectful. Prohibited content includes 
                nudity or sexual content, hate speech, violence, spam, illegal activities, or copyrighted 
                material without permission. We reserve the right to remove any content that violates 
                these guidelines without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Spaark platform, including its design, features, and content, is owned by Spaark and 
                protected by intellectual property laws. You retain ownership of content you upload, but 
                grant us a license to use, modify, and display it on our platform. You may not copy, 
                modify, or distribute our platform or content without permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Subscriptions and Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some features require payment. By subscribing, you agree to pay all applicable fees. 
                Subscriptions auto-renew unless cancelled. Refunds are provided according to our refund 
                policy. We reserve the right to change pricing with notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your account at any time for violations of these terms, 
                suspicious activity, or at our discretion. You may delete your account at any time 
                through settings. Upon termination, your right to use the platform ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Spaark is provided "as is" without warranties of any kind. We do not guarantee matches, 
                relationships, or specific results. We are not responsible for user conduct or content. 
                Use the platform at your own risk and exercise caution when meeting people in person.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, Spaark shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of the 
                platform. Our total liability shall not exceed the amount you paid us in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these terms at any time. We will notify you of significant changes by 
                posting the updated terms and updating the "Last updated" date. Your continued use 
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <Link to="/support">
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  Contact Support
                </Button>
              </Link>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
