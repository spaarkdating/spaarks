import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, X, Clock, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAdminUserId(user.id);
        await fetchTestimonials();
      }
    };
    init();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select(`
          *,
          user:profiles!testimonials_user_id_fkey(display_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading testimonials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await (supabase as any)
        .from("testimonials")
        .update({
          status,
          approved_at: status === "approved" ? new Date().toISOString() : null,
          approved_by: status === "approved" ? adminUserId : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: `Testimonial ${status}`,
        description: `The testimonial has been ${status}.`,
      });

      await fetchTestimonials();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const { error } = await (supabase as any)
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Testimonial deleted",
        description: "The testimonial has been removed.",
      });

      await fetchTestimonials();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading testimonials...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testimonial Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testimonials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No testimonials yet
            </p>
          ) : (
            testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-2">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">
                            {testimonial.user?.display_name || testimonial.user?.email || "Unknown User"}
                          </p>
                          {getStatusBadge(testimonial.status)}
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic">
                      "{testimonial.story}"
                    </p>

                    {testimonial.match_duration && (
                      <p className="text-xs text-muted-foreground">
                        📅 {testimonial.match_duration}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(testimonial.created_at), { addSuffix: true })}
                      </p>

                      <div className="flex gap-2">
                        {testimonial.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => updateStatus(testimonial.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(testimonial.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {testimonial.status === "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(testimonial.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Unapprove
                          </Button>
                        )}
                        {testimonial.status === "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(testimonial.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
