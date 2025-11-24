import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Target, Sparkles, Mail, Upload, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/Footer";

const AboutUs = () => {
  const { role } = useAdminRole();
  const isAdmin = role !== null;
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch team photos
  const { data: teamPhotos } = useQuery({
    queryKey: ["team-photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_photos")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, memberName, memberRole, displayOrder }: { 
      file: File; 
      memberName: string; 
      memberRole: string;
      displayOrder: number;
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('team-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-photos')
        .getPublicUrl(fileName);

      // Check if member already has a photo
      const { data: existing } = await supabase
        .from('team_photos')
        .select('*')
        .eq('member_name', memberName)
        .single();

      if (existing) {
        // Update existing photo
        const { error: updateError } = await supabase
          .from('team_photos')
          .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('member_name', memberName);

        if (updateError) throw updateError;

        // Delete old photo from storage if it exists
        if (existing.photo_url) {
          const oldFileName = existing.photo_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('team-photos').remove([oldFileName]);
          }
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('team_photos')
          .insert({
            member_name: memberName,
            member_role: memberRole,
            photo_url: publicUrl,
            display_order: displayOrder,
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-photos"] });
      toast.success("Photo uploaded successfully");
      setUploading(null);
    },
    onError: (error) => {
      toast.error("Failed to upload photo");
      console.error(error);
      setUploading(null);
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (memberName: string) => {
      const photo = teamPhotos?.find(p => p.member_name === memberName);
      if (!photo) return;

      // Delete from storage
      const fileName = photo.photo_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('team-photos').remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('team_photos')
        .delete()
        .eq('member_name', memberName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-photos"] });
      toast.success("Photo deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete photo");
      console.error(error);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, memberName: string, memberRole: string, displayOrder: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(memberName);
    uploadPhotoMutation.mutate({ file, memberName, memberRole, displayOrder });
  };

  const getPhotoUrl = (memberName: string) => {
    return teamPhotos?.find(p => p.member_name === memberName)?.photo_url;
  };

  const teamMembers = [
    { name: "Sourabh Sharma", role: "Co-Founder", initials: "SS", order: 1 },
    { name: "Aakanksha Singh", role: "Co-Founder", initials: "AS", order: 2 },
    { name: "Mandhata Singh", role: "Lead Developer", initials: "MS", order: 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">About Spaark</h1>
          <p className="text-xl text-muted-foreground">
            Connecting hearts, creating meaningful relationships
          </p>
        </div>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              At Spaark, we believe that everyone deserves to find meaningful connections and lasting love. 
              Our mission is to create a safe, authentic, and engaging platform where people can discover 
              compatible matches based on shared interests, values, and life goals.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're committed to fostering genuine relationships by combining innovative technology with 
              human-centered design, ensuring that every interaction on our platform brings people closer 
              to finding their perfect match.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Spaark was founded with a simple yet powerful vision: to revolutionize online dating by 
              creating a platform that prioritizes authenticity, safety, and meaningful connections over 
              superficial interactions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              We've built a community where users can be themselves, express their true interests, and 
              connect with like-minded individuals who share their values and relationship goals. Every 
              feature we develop is designed with one purpose in mind: helping people find genuine love 
              and companionship.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Today, Spaark continues to grow as a trusted platform for singles seeking meaningful 
              relationships, with thousands of success stories and counting.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Our Team
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Founders</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {teamMembers.slice(0, 2).map((member) => {
                    const photoUrl = getPhotoUrl(member.name);
                    return (
                      <Card key={member.name}>
                        <CardContent className="p-6">
                          <div className="relative group">
                            {photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={member.name}
                                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">{member.initials}</span>
                              </div>
                            )}
                            
                            {isAdmin && (
                              <div className="absolute top-0 right-1/2 translate-x-10 flex gap-2">
                                <Label 
                                  htmlFor={`upload-${member.name}`}
                                  className="cursor-pointer"
                                >
                                  <div className="p-2 bg-primary rounded-full hover:bg-primary/80 transition-colors">
                                    <Upload className="h-3 w-3 text-white" />
                                  </div>
                                  <Input
                                    id={`upload-${member.name}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, member.name, member.role, member.order)}
                                    disabled={uploading === member.name}
                                  />
                                </Label>
                                {photoUrl && (
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => deletePhotoMutation.mutate(member.name)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="text-xl font-bold text-center mb-1">{member.name}</h4>
                          <p className="text-muted-foreground text-center">{member.role}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-4">Development Team</h3>
                <Card>
                  <CardContent className="p-6">
                    {(() => {
                      const member = teamMembers[2];
                      const photoUrl = getPhotoUrl(member.name);
                      return (
                        <div className="relative group">
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt={member.name}
                              className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">{member.initials}</span>
                            </div>
                          )}
                          
                          {isAdmin && (
                            <div className="absolute top-0 right-1/2 translate-x-10 flex gap-2">
                              <Label 
                                htmlFor={`upload-${member.name}`}
                                className="cursor-pointer"
                              >
                                <div className="p-2 bg-primary rounded-full hover:bg-primary/80 transition-colors">
                                  <Upload className="h-3 w-3 text-white" />
                                </div>
                                <Input
                                  id={`upload-${member.name}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, member.name, member.role, member.order)}
                                  disabled={uploading === member.name}
                                />
                              </Label>
                              {photoUrl && (
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => deletePhotoMutation.mutate(member.name)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          <h4 className="text-xl font-bold text-center mb-1">{member.name}</h4>
                          <p className="text-muted-foreground text-center">{member.role}</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions or want to learn more about Spaark?
            </p>
            <Link to="/support">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary">
                Contact Us
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
