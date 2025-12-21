import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PhotoStep } from "@/components/onboarding/PhotoStep";
import { InterestsStep } from "@/components/onboarding/InterestsStep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Twitter, Linkedin } from "lucide-react";

interface ProfileEditProps {
  profile: any;
  photos: any[];
  interests: any[];
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

export const ProfileEdit = ({ profile, photos, interests, userId, onSave, onCancel }: ProfileEditProps) => {
  const [formData, setFormData] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    gender: profile.gender || "",
    looking_for: profile.looking_for || "",
    height: profile.height || "",
    occupation: profile.occupation || "",
    education: profile.education || "",
    relationship_goal: profile.relationship_goal || "",
    smoking: profile.smoking || "",
    drinking: profile.drinking || "",
    religion: profile.religion || "",
    instagram_handle: profile.instagram_handle || "",
    twitter_handle: profile.twitter_handle || "",
    linkedin_handle: profile.linkedin_handle || "",
    snapchat_handle: profile.snapchat_handle || "",
    photos: photos.map(p => p.photo_url),
    interests: interests.map(i => i.id),
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          location: formData.location,
          gender: formData.gender,
          looking_for: formData.looking_for,
          height: formData.height,
          occupation: formData.occupation,
          education: formData.education,
          relationship_goal: formData.relationship_goal,
          smoking: formData.smoking,
          drinking: formData.drinking,
          religion: formData.religion,
          instagram_handle: formData.instagram_handle,
          twitter_handle: formData.twitter_handle,
          linkedin_handle: formData.linkedin_handle,
          snapchat_handle: formData.snapchat_handle,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update photos
      await supabase.from("photos").delete().eq("user_id", userId);
      
      if (formData.photos.length > 0) {
        const photoPromises = formData.photos.map((photo: string, index: number) =>
          supabase.from("photos").insert({
            user_id: userId,
            photo_url: photo,
            display_order: index,
          })
        );
        await Promise.all(photoPromises);
      }

      // Update interests
      await supabase.from("user_interests").delete().eq("user_id", userId);
      
      if (formData.interests.length > 0) {
        const interestPromises = formData.interests.map((interestId: string) =>
          supabase.from("user_interests").insert({
            user_id: userId,
            interest_id: interestId,
          })
        );
        await Promise.all(interestPromises);
      }

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });

      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lookingFor">Looking For</Label>
                <Select
                  value={formData.looking_for}
                  onValueChange={(value) => setFormData({ ...formData, looking_for: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Height (optional)</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="e.g., 5'8&quot; or 173cm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation (optional)</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="What do you do?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education (optional)</Label>
                <Select
                  value={formData.education}
                  onValueChange={(value) => setFormData({ ...formData, education: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="some-college">Some College</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD/Doctorate</SelectItem>
                    <SelectItem value="trade-school">Trade School</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationshipGoal">Relationship Goal (optional)</Label>
                <Select
                  value={formData.relationship_goal}
                  onValueChange={(value) => setFormData({ ...formData, relationship_goal: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long-term">Long-term Relationship</SelectItem>
                    <SelectItem value="short-term">Short-term Fun</SelectItem>
                    <SelectItem value="friendship">Friendship</SelectItem>
                    <SelectItem value="not-sure">Not Sure Yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smoking">Smoking</Label>
                  <Select
                    value={formData.smoking}
                    onValueChange={(value) => setFormData({ ...formData, smoking: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Do you smoke?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="socially">Socially</SelectItem>
                      <SelectItem value="regularly">Regularly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drinking">Drinking</Label>
                  <Select
                    value={formData.drinking}
                    onValueChange={(value) => setFormData({ ...formData, drinking: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Do you drink?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="socially">Socially</SelectItem>
                      <SelectItem value="regularly">Regularly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="religion">Religion (optional)</Label>
                <Select
                  value={formData.religion}
                  onValueChange={(value) => setFormData({ ...formData, religion: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your religion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="christianity">Christianity</SelectItem>
                    <SelectItem value="islam">Islam</SelectItem>
                    <SelectItem value="hinduism">Hinduism</SelectItem>
                    <SelectItem value="buddhism">Buddhism</SelectItem>
                    <SelectItem value="judaism">Judaism</SelectItem>
                    <SelectItem value="sikhism">Sikhism</SelectItem>
                    <SelectItem value="atheist">Atheist</SelectItem>
                    <SelectItem value="agnostic">Agnostic</SelectItem>
                    <SelectItem value="spiritual">Spiritual</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Add your social media handles so matches can connect with you (optional)
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                  placeholder="@username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={formData.linkedin_handle}
                  onChange={(e) => setFormData({ ...formData, linkedin_handle: e.target.value })}
                  placeholder="linkedin.com/in/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snapchat" className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.99.99 0 0 1 .42-.09c.201 0 .36.03.42.09.18.12.27.27.3.42.045.18.015.39-.03.54-.03.105-.074.18-.148.27-.106.13-.344.27-.674.42a4.26 4.26 0 0 1-.749.24c-.106.03-.203.06-.284.09-.061.015-.09.03-.075.06.27.63.69 1.215 1.2 1.68.46.42.974.72 1.47.899.166.06.33.09.45.12.12.03.21.06.27.09a.42.42 0 0 1 .18.105.3.3 0 0 1 .09.18.24.24 0 0 1-.045.195c-.18.375-.72.555-1.068.689-.21.075-.39.135-.494.18a4.12 4.12 0 0 0-.27.12c-.106.06-.135.15-.135.285 0 .065-.01.135-.02.21-.02.12-.02.18 0 .27.06.165.27.285.465.345a1.14 1.14 0 0 0 .33.045c.45 0 .93-.18 1.365-.345.24-.09.465-.195.69-.285.06-.03.12-.045.195-.045.165 0 .33.06.45.165.135.12.21.285.21.465 0 .165-.06.315-.18.435-.345.345-.99.6-1.86.735-.12.018-.24.03-.36.03h-.495c-.255 0-.54.03-.78.06l-.225.03c-.135.018-.27.03-.375.045-.285.045-.57.15-.825.39-.36.33-.675.915-1.455 1.38-.615.375-1.41.57-2.385.57-.93 0-1.71-.195-2.325-.54-.78-.45-1.095-1.02-1.44-1.35-.24-.24-.525-.345-.825-.375-.12-.02-.24-.03-.375-.045l-.225-.03c-.255-.03-.54-.06-.81-.06h-.45c-.12 0-.24-.01-.36-.03-.87-.135-1.515-.39-1.86-.735a.648.648 0 0 1-.18-.435c0-.18.075-.345.21-.465a.6.6 0 0 1 .45-.165c.075 0 .135.015.195.045.225.09.45.195.69.285.435.165.915.345 1.365.345a1.14 1.14 0 0 0 .33-.045c.195-.06.405-.18.465-.345.02-.09.02-.15 0-.27a1.44 1.44 0 0 0-.02-.21c0-.135-.03-.225-.135-.285a4.12 4.12 0 0 0-.27-.12 5.7 5.7 0 0 1-.494-.18c-.348-.134-.888-.314-1.068-.689a.24.24 0 0 1-.045-.195.3.3 0 0 1 .09-.18.42.42 0 0 1 .18-.105c.06-.03.15-.06.27-.09.12-.03.284-.06.45-.12a4.96 4.96 0 0 0 1.47-.899c.51-.465.93-1.05 1.2-1.68.015-.03-.014-.045-.075-.06-.08-.03-.177-.06-.284-.09a4.26 4.26 0 0 1-.749-.24c-.33-.15-.568-.29-.674-.42a.714.714 0 0 1-.148-.27c-.045-.15-.075-.36-.03-.54.03-.15.12-.3.3-.42.06-.06.219-.09.42-.09a.99.99 0 0 1 .42.09c.374.18.733.285 1.033.301.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.3-4.847C7.859 1.07 11.216.793 12.206.793z"/>
                  </svg>
                  Snapchat
                </Label>
                <Input
                  id="snapchat"
                  value={formData.snapchat_handle}
                  onChange={(e) => setFormData({ ...formData, snapchat_handle: e.target.value })}
                  placeholder="@username"
                />
              </div>
            </TabsContent>

            <TabsContent value="photos">
              <PhotoStep
                data={formData}
                updateData={(data) => setFormData({ ...formData, ...data })}
                onNext={() => {}}
              />
            </TabsContent>

            <TabsContent value="interests">
              <InterestsStep
                data={formData}
                updateData={(data) => setFormData({ ...formData, ...data })}
                onNext={() => {}}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
