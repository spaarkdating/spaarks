import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft, Heart } from "lucide-react";

const SubmitTestimonial = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [story, setStory] = useState("");
  const [matchDuration, setMatchDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please log in to submit a testimonial",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    if (story.trim().length < 50) {
      toast({
        title: "Story too short",
        description: "Please share a more detailed story (at least 50 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any).from("testimonials").insert({
        user_id: user.id,
        rating,
        story: story.trim(),
        match_duration: matchDuration.trim() || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Testimonial submitted!",
        description: "Thank you! Your testimonial is pending approval and will be visible on the homepage soon.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-xl border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Heart className="h-8 w-8 text-primary fill-primary" />
              Share Your Success Story
            </CardTitle>
            <CardDescription>
              Help others find love by sharing your experience with Spaark
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Your Rating *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (hoveredRating || rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {rating === 5 ? "Amazing! ⭐⭐⭐⭐⭐" : 
                     rating === 4 ? "Great! ⭐⭐⭐⭐" :
                     rating === 3 ? "Good! ⭐⭐⭐" :
                     rating === 2 ? "Okay ⭐⭐" : "Poor ⭐"}
                  </p>
                )}
              </div>

              {/* Story */}
              <div className="space-y-2">
                <Label htmlFor="story" className="text-base font-semibold">
                  Your Success Story *
                </Label>
                <Textarea
                  id="story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Share your experience... How did you meet? What made Spaark special? Tell us about your journey!"
                  rows={6}
                  className="resize-none"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {story.length}/500 characters (minimum 50)
                </p>
              </div>

              {/* Match Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-base font-semibold">
                  How long have you been together? (optional)
                </Label>
                <Input
                  id="duration"
                  value={matchDuration}
                  onChange={(e) => setMatchDuration(e.target.value)}
                  placeholder="e.g., Matched 6 months ago, Dating for 1 year, Engaged"
                  maxLength={50}
                />
              </div>

              {/* Notice */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  📝 <strong>Note:</strong> Your testimonial will be reviewed by our team before being published on the homepage. 
                  We appreciate your patience and honesty!
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0 || story.length < 50}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg py-6"
              >
                {isSubmitting ? "Submitting..." : "Submit Testimonial"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitTestimonial;
