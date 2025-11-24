import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Eye, Users } from "lucide-react";
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

export const NewsletterManagement = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

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
      const { error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject,
          message,
          emails: subscribers.map(s => s.email),
        },
      });

      if (error) throw error;

      toast({
        title: "Newsletter Sent! 🎉",
        description: `Successfully sent to ${subscribers.length} subscribers.`,
      });

      // Clear form
      setSubject("");
      setMessage("");
      setShowPreview(false);
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
