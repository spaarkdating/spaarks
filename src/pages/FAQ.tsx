import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Shield, CreditCard, UserX, Eye } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      category: "Getting Started",
      icon: Heart,
      questions: [
        {
          q: "How do I create an account?",
          a: "Click the 'Sign Up' button on the homepage, enter your email and password, then complete the onboarding process by adding your profile information, photos, and interests."
        },
        {
          q: "What's the difference between online and offline dating modes?",
          a: "When you register, you choose between 'Date Online' or 'Date Offline'. This preference determines who you see - you'll only match with users who selected the same dating mode."
        },
        {
          q: "How many photos do I need to upload?",
          a: "You must upload at least 5 photos to complete your profile. This helps other users get a better sense of who you are."
        }
      ]
    },
    {
      category: "Matching & Swiping",
      icon: MessageCircle,
      questions: [
        {
          q: "How does matching work?",
          a: "When you swipe right on someone and they swipe right on you, it's a match! You'll both receive a notification and can start messaging each other."
        },
        {
          q: "What happens if I swipe left?",
          a: "Swiping left means you're not interested. That profile won't appear again in your queue, and they won't know you swiped left."
        },
        {
          q: "Can I see who viewed my profile?",
          a: "Yes! Navigate to the 'Profile Views' page from your dashboard to see who has viewed your profile recently."
        },
        {
          q: "How does the age filter work?",
          a: "You can set your preferred age range in Settings. You'll only see profiles of users within your specified age range."
        }
      ]
    },
    {
      category: "Messaging",
      icon: MessageCircle,
      questions: [
        {
          q: "Can I message someone before matching?",
          a: "No, you can only message users you've matched with. This ensures both people are interested in connecting."
        },
        {
          q: "How do I know if my message was read?",
          a: "Read receipts show you when your messages have been seen by the other person."
        },
        {
          q: "Can I unmatch someone?",
          a: "Yes, you can unmatch or block a user from their profile or from the conversation."
        }
      ]
    },
    {
      category: "Safety & Privacy",
      icon: Shield,
      questions: [
        {
          q: "How do I block or report someone?",
          a: "Visit the user's profile and click the 'Block User' button. If the content violates our terms, you can also report photos through the report feature."
        },
        {
          q: "Who can see my profile?",
          a: "Only users who match your dating mode preference (online/offline) and fall within your age range filters can see your profile."
        },
        {
          q: "How do I report inappropriate content?",
          a: "Click the report icon on any photo to submit a report to our moderation team. Reports are reviewed within 24-48 hours."
        },
        {
          q: "Can I hide my profile?",
          a: "Yes, you can deactivate your account from Settings. Your profile will be hidden but can be reactivated by logging back in."
        }
      ]
    },
    {
      category: "Account & Billing",
      icon: CreditCard,
      questions: [
        {
          q: "Is my first match free?",
          a: "Yes! Your first match is completely free. Subsequent matches may require a subscription."
        },
        {
          q: "How do I change my email?",
          a: "Go to Settings > Email Settings to update your email address. You'll need to verify the new email."
        },
        {
          q: "How do I delete my account?",
          a: "In Settings, scroll to 'Account Management' and select 'Permanently Delete Account'. This action cannot be undone."
        },
        {
          q: "Can I change my dating mode preference?",
          a: "Yes, you can switch between online and offline dating modes in your Settings at any time."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground mt-2">Find answers to common questions about Spaark</p>
          </div>

          {faqs.map((category, idx) => {
            const Icon = category.icon;
            return (
              <Card key={idx} className="shadow-xl border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}

          <Card className="shadow-xl border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Still Have Questions?</CardTitle>
              <CardDescription>Our support team is here to help</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Can't find what you're looking for? Contact our support team and we'll get back to you as soon as possible.
              </p>
              <Link to="/support">
                <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;