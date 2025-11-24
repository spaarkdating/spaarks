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
    photos: photos.map(p => p.photo_url),
    interests: interests.map(i => i.id),
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
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
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
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
