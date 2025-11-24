import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
});

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = emailSchema.parse({ email });
      setIsSubmitting(true);

      // Save to database
      const { error: dbError } = await supabase
        .from("newsletter_subscriptions")
        .insert([{ email: validatedData.email }]);

      if (dbError) {
        if (dbError.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "This email is already registered for our newsletter.",
          });
          return;
        }
        throw dbError;
      }

      // Send welcome email
      const { error: emailError } = await supabase.functions.invoke("send-welcome-email", {
        body: { email: validatedData.email },
      });

      if (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't throw - subscription was successful even if email failed
      }

      setIsSuccess(true);
      setEmail("");
      
      toast({
        title: "Success! 🎉",
        description: "You've been subscribed! Check your email for a welcome message.",
      });

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2 text-foreground">Stay Updated</h3>
        <p className="text-sm text-muted-foreground">
          Get dating tips, success stories, and exclusive offers delivered to your inbox
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || isSuccess}
              className="pl-10 bg-background/50 border-border focus:border-primary transition-all"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || isSuccess || !email}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg hover:shadow-primary/50 min-w-[120px]"
          >
            {isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Subscribed
              </>
            ) : isSubmitting ? (
              "Subscribing..."
            ) : (
              "Subscribe"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};
