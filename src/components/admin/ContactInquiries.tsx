import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Mail, User, Clock, Send } from "lucide-react";

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

interface ContactInquiriesProps {
  adminRole: "admin" | "moderator" | "support";
}

const ContactInquiries = ({ adminRole }: ContactInquiriesProps) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchInquiries = async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inquiries:", error);
    } else if (data) {
      setInquiries(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await (supabase as any)
      .from("contact_inquiries")
      .update({
        admin_reply: reply,
        status: newStatus || selectedInquiry.status,
        replied_by: user?.id,
        replied_at: reply ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedInquiry.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inquiry updated",
        description: "Contact inquiry has been updated successfully.",
      });
      setReply("");
      setSelectedInquiry(null);
      fetchInquiries();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "outline";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading inquiries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Inquiries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contact inquiries</p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedInquiry?.id === inquiry.id ? "border-primary ring-1 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedInquiry(inquiry);
                  setNewStatus(inquiry.status);
                  setReply(inquiry.admin_reply || "");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{inquiry.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{inquiry.name}</span>
                        <span>•</span>
                        <span>{inquiry.email}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(inquiry.status)}>
                      {inquiry.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {inquiry.message}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedInquiry && (
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{selectedInquiry.subject}</h3>
                <Badge variant={getStatusColor(selectedInquiry.status)} className="mt-1">
                  {selectedInquiry.status}
                </Badge>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedInquiry.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                    {selectedInquiry.email}
                  </a>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="text-sm mt-1 whitespace-pre-wrap bg-background p-3 rounded-lg border">
                  {selectedInquiry.message}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Admin Reply</label>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your response to send via email..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Note: The reply will be stored here. To send it, email the user directly at {selectedInquiry.email}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateInquiry}
                className="flex-1 bg-gradient-to-r from-primary to-secondary"
              >
                <Send className="h-4 w-4 mr-2" />
                Update Inquiry
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}&body=${encodeURIComponent(reply)}`)}
                disabled={!reply}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactInquiries;