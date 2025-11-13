import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

const SupportTickets = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();

  const fetchTickets = async () => {
    const { data } = await (supabase as any)
      .from("support_tickets")
      .select("*, profile:profiles!support_tickets_user_id_fkey(display_name, email)")
      .order("created_at", { ascending: false });

    if (data) {
      setTickets(data);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    const { error } = await (supabase as any)
      .from("support_tickets")
      .update({
        admin_reply: reply,
        status: newStatus || selectedTicket.status,
      })
      .eq("id", selectedTicket.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ticket updated",
        description: "Support ticket has been updated successfully.",
      });
      setReply("");
      setSelectedTicket(null);
      fetchTickets();
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No support tickets</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id ? "border-primary" : ""
                }`}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setNewStatus(ticket.status);
                  setReply(ticket.admin_reply || "");
                }}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        From: {ticket.profile?.display_name || ticket.profile?.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ticket.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{selectedTicket.subject}</h3>
              <div className="flex gap-2 mb-4">
                <Badge variant={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
                <Badge variant={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status}
                </Badge>
              </div>
              <p className="text-sm mb-4 whitespace-pre-wrap">{selectedTicket.message}</p>
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
                placeholder="Type your response to the user..."
                rows={6}
              />
            </div>

            <Button
              onClick={handleUpdateTicket}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              Update Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportTickets;
