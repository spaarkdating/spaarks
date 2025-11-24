import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Eye, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const NewsletterHistory = () => {
  const { data: newsletters, isLoading } = useQuery({
    queryKey: ["newsletter-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_history")
        .select("*")
        .order("sent_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getPreviewHtml = (message: string) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Newsletter History
        </CardTitle>
        <CardDescription>
          View all previously sent newsletters
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading history...
          </div>
        ) : newsletters && newsletters.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {newsletters.map((newsletter: any) => (
                <div
                  key={newsletter.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {newsletter.subject}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDistanceToNow(new Date(newsletter.sent_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{newsletter.recipient_count} recipients</span>
                        </div>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Newsletter Preview</DialogTitle>
                          <DialogDescription>
                            Sent {formatDistanceToNow(new Date(newsletter.sent_at), {
                              addSuffix: true,
                            })} to {newsletter.recipient_count} subscribers
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Subject:</p>
                            <p className="font-semibold">{newsletter.subject}</p>
                          </div>
                          <div
                            className="border rounded-lg p-4 bg-background"
                            dangerouslySetInnerHTML={{
                              __html: getPreviewHtml(newsletter.message),
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {newsletter.message}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No newsletters sent yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
