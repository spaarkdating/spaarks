import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Clock, CheckCircle, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { format } from "date-fns";

interface Inquiry {
  id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  replied_at: string | null;
}

const InquiryStatus = () => {
  const [email, setEmail] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("id, subject, message, status, admin_reply, created_at, replied_at")
        .eq("email", email.trim().toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInquiries(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No inquiries found",
          description: "No inquiries were found for this email address.",
        });
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inquiries. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Open</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case "resolved":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Check Inquiry Status | Spaark Dating"
        description="Check the status of your contact inquiry with Spaark Dating support."
      />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Spaark Logo" 
                className="h-10 w-10 rounded-lg bg-white p-1"
              />
              <span className="text-xl font-bold text-primary">Spaark</span>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contact
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Check Your <span className="text-primary">Inquiry Status</span>
            </h1>
            <p className="text-muted-foreground">
              Enter your email address to view the status of your support inquiries.
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {inquiries.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Inquiries Found</h3>
                      <p className="text-muted-foreground mb-4">
                        We couldn't find any inquiries associated with this email.
                      </p>
                      <Link to="/contact">
                        <Button>Submit a New Inquiry</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                      Found {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
                    </h2>
                    
                    {inquiries.map((inquiry, index) => (
                      <motion.div
                        key={inquiry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-lg">{inquiry.subject}</CardTitle>
                              {getStatusBadge(inquiry.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              Submitted {format(new Date(inquiry.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-1">Your Message</h4>
                              <p className="text-sm bg-muted/50 rounded-lg p-3">{inquiry.message}</p>
                            </div>
                            
                            {inquiry.admin_reply && (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <h4 className="text-sm font-medium text-green-500">Admin Reply</h4>
                                  {inquiry.replied_at && (
                                    <span className="text-xs text-muted-foreground">
                                      • {format(new Date(inquiry.replied_at), "MMM d, yyyy")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                  {inquiry.admin_reply}
                                </p>
                              </div>
                            )}
                            
                            {inquiry.status === "open" && !inquiry.admin_reply && (
                              <p className="text-sm text-muted-foreground italic">
                                Your inquiry is being reviewed. We'll respond as soon as possible.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default InquiryStatus;
