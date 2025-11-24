import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft, Heart, Upload, X, Image as ImageIcon, Video } from "lucide-react";

const SubmitTestimonial = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [story, setStory] = useState("");
  const [matchDuration, setMatchDuration] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingTestimonial, setExistingTestimonial] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
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
      
      // Check if user has a pending testimonial
      const { data: testimonial } = await (supabase as any)
        .from("testimonials")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();
      
      if (testimonial) {
        setExistingTestimonial(testimonial);
        setIsEditing(true);
        setRating(testimonial.rating);
        setStory(testimonial.story);
        setMatchDuration(testimonial.match_duration || "");
        setPhotoPreview(testimonial.photo_url);
        setVideoPreview(testimonial.video_url);
      }
    };
    checkAuth();
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Photo must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadMedia = async (userId: string) => {
    let photoUrl = existingTestimonial?.photo_url || null;
    let videoUrl = existingTestimonial?.video_url || null;

    // Upload photo if selected
    if (photoFile) {
      const photoExt = photoFile.name.split('.').pop();
      const photoPath = `${userId}/photo-${Date.now()}.${photoExt}`;
      
      const { error: photoError } = await supabase.storage
        .from('testimonials')
        .upload(photoPath, photoFile);

      if (photoError) throw photoError;

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(photoPath);

      photoUrl = publicUrl;

      // Delete old photo if exists
      if (existingTestimonial?.photo_url && photoFile) {
        const oldPath = existingTestimonial.photo_url.split('/testimonials/')[1];
        if (oldPath) {
          await supabase.storage.from('testimonials').remove([oldPath]);
        }
      }
    }

    // Upload video if selected
    if (videoFile) {
      const videoExt = videoFile.name.split('.').pop();
      const videoPath = `${userId}/video-${Date.now()}.${videoExt}`;
      
      const { error: videoError } = await supabase.storage
        .from('testimonials')
        .upload(videoPath, videoFile);

      if (videoError) throw videoError;

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(videoPath);

      videoUrl = publicUrl;

      // Delete old video if exists
      if (existingTestimonial?.video_url && videoFile) {
        const oldPath = existingTestimonial.video_url.split('/testimonials/')[1];
        if (oldPath) {
          await supabase.storage.from('testimonials').remove([oldPath]);
        }
      }
    }

    return { photoUrl, videoUrl };
  };

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
      const { photoUrl, videoUrl } = await uploadMedia(user.id);

      if (isEditing && existingTestimonial) {
        // Update existing testimonial
        const { error } = await (supabase as any)
          .from("testimonials")
          .update({
            rating,
            story: story.trim(),
            match_duration: matchDuration.trim() || null,
            photo_url: photoUrl,
            video_url: videoUrl,
          })
          .eq("id", existingTestimonial.id);

        if (error) throw error;

        toast({
          title: "Testimonial updated!",
          description: "Your changes have been saved and are pending approval.",
        });
      } else {
        // Insert new testimonial
        const { error } = await (supabase as any).from("testimonials").insert({
          user_id: user.id,
          rating,
          story: story.trim(),
          match_duration: matchDuration.trim() || null,
          photo_url: photoUrl,
          video_url: videoUrl,
          status: "pending",
        });

        if (error) throw error;

        toast({
          title: "Testimonial submitted!",
          description: "Thank you! Your testimonial is pending approval and will be visible on the homepage soon.",
        });
      }

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
              {isEditing ? "Edit Your Success Story" : "Share Your Success Story"}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update your experience with Spaark" 
                : "Help others find love by sharing your experience with Spaark"}
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

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Add a Photo (optional)</Label>
                <div className="flex gap-4 items-start">
                  {photoPreview ? (
                    <div className="relative">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Label 
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Photo</span>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoChange}
                      />
                    </Label>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Max size: 5MB. Formats: JPG, PNG, WEBP
                  </p>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Add a Video (optional)</Label>
                <div className="flex gap-4 items-start">
                  {videoPreview ? (
                    <div className="relative">
                      <video 
                        src={videoPreview} 
                        className="w-48 h-32 object-cover rounded-lg border-2 border-border"
                        controls
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Label 
                      htmlFor="video-upload"
                      className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <Video className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Video</span>
                      <Input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoChange}
                      />
                    </Label>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Max size: 50MB. Formats: MP4, MOV, AVI
                  </p>
                </div>
              </div>

              {/* Notice */}
              {isEditing ? (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-sm text-foreground">
                    📝 <strong>Editing Mode:</strong> You're updating your pending testimonial. 
                    Your changes will be reviewed again before publication.
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    📝 <strong>Note:</strong> Your testimonial will be reviewed by our team before being published on the homepage. 
                    We appreciate your patience and honesty!
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0 || story.length < 50}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg py-6"
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update Testimonial" : "Submit Testimonial"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitTestimonial;
