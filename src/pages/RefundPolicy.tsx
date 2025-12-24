import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/Footer";
import { SEO, JsonLd, getBreadcrumbSchema } from "@/components/SEO";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <SEO
        title="Refund & Cancellation Policy"
        description="Read Spaark's Refund and Cancellation Policy. Understand our refund process and cancellation terms for payments."
        keywords="Spaark refund policy, cancellation policy, payment refund, subscription cancellation"
        canonicalUrl="/refund-policy"
      />
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Refund & Cancellation Policy", url: "/refund-policy" },
        ])}
      />
      <Header />

      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <header className="text-center mb-12">
          <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-4 gradient-text">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </header>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Transaction Agreement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Upon completing a Transaction, you are entering into a legally binding and enforceable agreement with us
                to purchase the product and/or service. After this point the User may cancel the Transaction unless it
                has been specifically provided for on the Platform. In which case, the cancellation will be subject to
                the terms mentioned on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Cancellation Requests</h2>
              <p className="text-muted-foreground leading-relaxed">
                We shall retain the discretion in approving any cancellation requests and we may ask for additional
                details before approving any requests. Cancellation requests are subject to review and approval at our
                sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Refund Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once you have received the product and/or service, the only event where you can request for a
                replacement or a return and a refund is if the product and/or service does not match the description as
                mentioned on the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Refund Request Timeline</h2>
              <p className="text-muted-foreground leading-relaxed">
                Any request for refund must be submitted within <strong>three (3) days</strong> from the date of the
                Transaction or such number of days prescribed on the Platform, which shall in no event be less than
                three days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A User may submit a claim for a refund for a purchase made by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                <li>Raising a support ticket through our support page</li>
                <li>
                  Contacting us via email at{" "}
                  <a href="mailto:spaarkdating@spaarkdating.com" className="text-primary hover:underline">
                    spaarkdating@spaarkdating.com
                  </a>
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">When submitting a refund request, please provide:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>A clear and specific reason for the refund request</li>
                <li>The exact terms that have been violated (if applicable)</li>
                <li>Any proof or documentation supporting your claim, if required</li>
                <li>Your transaction ID and payment details</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Refund Decision</h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether a refund will be provided will be determined by us, and we may ask for additional details before
                approving any requests. All refund decisions are final and at our sole discretion. We reserve the right
                to reject refund requests that do not meet our criteria or are submitted outside the specified
                timeframe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Refund Processing</h2>
              <p className="text-muted-foreground leading-relaxed">
                Once a refund is approved, the amount will be credited back to the original payment method used for the
                transaction. The processing time may vary depending on your bank or payment provider, typically taking
                5-10 business days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Non-Refundable Items</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The following are generally non-refundable unless the product/service does not match the description:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Services that have been fully rendered</li>
                <li>Digital products that have been accessed or downloaded</li>
                <li>Subscription services after the usage period has commenced</li>
                <li>Requests made after the refund request timeline has expired</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about our Refund and Cancellation Policy, or if you would like to submit a
                refund request, please contact our support team:
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/support">
                  <Button className="bg-gradient-to-r from-primary to-secondary">Contact Support</Button>
                </Link>
                <Link to="/payment-terms">
                  <Button variant="outline">View Payment Terms</Button>
                </Link>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
