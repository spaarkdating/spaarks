import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Eye, Users, FileText, Megaphone, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEWSLETTER_TEMPLATES = {
  blank: {
    name: "Blank Template",
    icon: FileText,
    subject: "",
    message: "",
  },
  announcement: {
    name: "Announcement",
    icon: Megaphone,
    subject: "Exciting News from Spaark! 🎉",
    message: `Hi there!

We have some exciting news to share with you today!

[Write your announcement here - what's new, what's changing, or what's happening]

Key highlights:
• [Highlight 1]
• [Highlight 2]
• [Highlight 3]

We're thrilled to bring you these updates and can't wait to hear what you think!

Happy matching,
The Spaark Team ❤️`,
  },
  promotion: {
    name: "Promotion",
    icon: Sparkles,
    subject: "Special Offer Just for You! 💝",
    message: `Hello Spaark Community!

We have something special for you today!

[Describe your promotion or special offer]

Here's what you get:
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]

[Add any terms, conditions, or time limits]

Don't miss out on this opportunity to enhance your Spaark experience!

With love,
The Spaark Team ❤️`,
  },
  feature: {
    name: "Feature Update",
    icon: Sparkles,
    subject: "New Features to Enhance Your Experience! ✨",
    message: `Hey Spaark Users!

We've been working hard to make your experience even better, and we're excited to announce some new features!

What's New:
🎯 [Feature 1 Name]
[Brief description of what it does and how to use it]

💫 [Feature 2 Name]
[Brief description of what it does and how to use it]

❤️ [Feature 3 Name]
[Brief description of what it does and how to use it]

We hope you love these new additions as much as we do! As always, we're here to help if you have any questions.

Happy dating,
The Spaark Team`,
  },
};

export const NewsletterManagement = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof NEWSLETTER_TEMPLATES>("blank");
  const { toast } = useToast();

  const handleTemplateChange = (templateKey: keyof typeof NEWSLETTER_TEMPLATES) => {
    setSelectedTemplate(templateKey);
    const template = NEWSLETTER_TEMPLATES[templateKey];
    setSubject(template.subject);
    setMessage(template.message);
  };

  // Fetch active subscribers
  const { data: subscribers } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("email")
        .eq("is_active", true);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    if (!subscribers || subscribers.length === 0) {
      toast({
        title: "No Subscribers",
        description: "There are no active subscribers to send to.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Send newsletter
      const { error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject,
          message,
          emails: subscribers.map(s => s.email),
        },
      });

      if (error) throw error;

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("newsletter_history").insert({
          subject,
          message,
          recipient_count: subscribers.length,
          sent_by: user.id,
        });
      }

      toast({
        title: "Newsletter Sent! 🎉",
        description: `Successfully sent to ${subscribers.length} subscribers.`,
      });

      // Clear form
      setSubject("");
      setMessage("");
      setShowPreview(false);
      setSelectedTemplate("blank");
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "An error occurred while sending the newsletter.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewHtml = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2663; text-align: center; margin-bottom: 30px;">❤️ Spaark Update</h1>
        <div style="padding: 30px; background: #fef2f2; border-radius: 10px; line-height: 1.6;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
          You're receiving this because you subscribed to Spaark updates.
        </p>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Subscriber Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Active Subscribers
          </CardTitle>
          <CardDescription>
            Total subscribers currently receiving updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {subscribers?.length || 0}
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Compose Newsletter
          </CardTitle>
          <CardDescription>
            Create and send updates to all active subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Newsletter Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NEWSLETTER_TEMPLATES).map(([key, template]) => {
                  const Icon = template.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a pre-designed template or start from blank
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Exciting New Features Coming to Spaark!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your newsletter content here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          <div className="flex gap-3">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled={!subject || !message}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Email Preview</DialogTitle>
                  <DialogDescription>
                    This is how your newsletter will appear to subscribers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Subject:</Label>
                    <p className="font-semibold">{subject}</p>
                  </div>
                  <div 
                    className="border rounded-lg p-4 bg-background"
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <Button
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
              onClick={handleSendNewsletter}
              disabled={isSending || !subject || !message || !subscribers?.length}
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {subscribers?.length || 0} Subscribers
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Once sent, the newsletter cannot be recalled. Please review carefully before sending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
