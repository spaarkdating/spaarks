import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Heart, Star, Search, Filter, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 9;

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    filterTestimonials();
  }, [testimonials, ratingFilter, searchQuery]);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("testimonials")
        .select(`
          *,
          user:profiles!testimonials_user_id_fkey(display_name),
          partner:profiles!testimonials_partner_id_fkey(display_name)
        `)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTestimonials = () => {
    let filtered = [...testimonials];

    // Filter by rating
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((t) => t.rating === rating);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.story.toLowerCase().includes(query) ||
          t.user?.display_name?.toLowerCase().includes(query) ||
          t.match_duration?.toLowerCase().includes(query)
      );
    }

    setFilteredTestimonials(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTestimonials = filteredTestimonials.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse fill-primary" />
          <p className="text-muted-foreground">Loading success stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary animate-heartbeat" />
              <h1 className="text-2xl font-bold gradient-text">Success Stories</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real Love Stories from <span className="gradient-text">Real People</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how Spaark has helped thousands find their perfect match
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ Only</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ & Up</SelectItem>
                <SelectItem value="3">⭐⭐⭐ & Up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredTestimonials.length} {filteredTestimonials.length === 1 ? "story" : "stories"}
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        {currentTestimonials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No stories found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
            <Button onClick={() => { setRatingFilter("all"); setSearchQuery(""); }}>
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <AnimatePresence mode="wait">
              {currentTestimonials.map((testimonial, idx) => {
                const displayName = testimonial.user?.display_name || "Anonymous";
                const partnerName = testimonial.partner?.display_name || "their match";
                const names = testimonial.partner ? `${displayName} & ${partnerName}` : displayName;

                return (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="h-full hover:shadow-xl transition-all border-2 hover:border-primary/50 card-hover group">
                      <CardContent className="p-6 flex flex-col h-full">
                        {/* Media Section */}
                        {(testimonial.photo_url || testimonial.video_url) && (
                          <div className="mb-4 rounded-lg overflow-hidden">
                            {testimonial.video_url ? (
                              <video 
                                src={testimonial.video_url}
                                controls
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : testimonial.photo_url && (
                              <img 
                                src={testimonial.photo_url}
                                alt="Testimonial"
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            )}
                          </div>
                        )}
                        
                        {/* Rating */}
                        <div className="flex gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-5 w-5 fill-primary text-primary group-hover:scale-110 transition-transform"
                              style={{ transitionDelay: `${i * 50}ms` }}
                            />
                          ))}
                        </div>

                        {/* Story */}
                        <p className="text-muted-foreground mb-6 italic flex-1 leading-relaxed">
                          "{testimonial.story}"
                        </p>

                        {/* Footer */}
                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background" />
                              {testimonial.partner && (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary border-2 border-background" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{names}</p>
                              {testimonial.match_duration && (
                                <p className="text-xs text-muted-foreground">{testimonial.match_duration}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center items-center gap-2"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "bg-gradient-to-r from-primary to-secondary" : ""}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 text-center"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-12">
              <Heart className="h-16 w-16 text-primary mx-auto mb-6 fill-primary animate-pulse" />
              <h3 className="text-3xl font-bold mb-4">Ready to Write Your Story?</h3>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of happy couples who found love on Spaark
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg text-lg px-8 py-6">
                  <Heart className="h-5 w-5 mr-2" />
                  Start Your Journey
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Testimonials;
