import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ArrowRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { PhotoStep } from "@/components/onboarding/PhotoStep";
import { BasicInfoStep } from "@/components/onboarding/BasicInfoStep";
import { InterestsStep } from "@/components/onboarding/InterestsStep";
import { PreferencesStep } from "@/components/onboarding/PreferencesStep";

const steps = [
  { id: 1, title: "Welcome", component: WelcomeStep },
  { id: 2, title: "Photos", component: PhotoStep },
  { id: 3, title: "About You", component: BasicInfoStep },
  { id: 4, title: "Interests", component: InterestsStep },
  { id: 5, title: "Preferences", component: PreferencesStep },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    photos: [],
    displayName: "",
    bio: "",
    dateOfBirth: null,
    gender: "",
    interests: [],
    location: "",
    lookingFor: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Check if profile is already complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile?.bio && profile?.gender && profile?.looking_for) {
        navigate("/dashboard");
      }
    };

    checkUser();
  }, [navigate]);

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!userId) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.displayName,
          bio: formData.bio,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          location: formData.location,
          looking_for: formData.lookingFor,
          dating_mode: formData.datingMode || "online",
        } as any)
        .eq("id", userId);

      if (profileError) throw profileError;

      // Add photos
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

      // Add interests
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
        title: "Profile completed!",
        description: "Welcome to Spaark! Start swiping to find your match.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const isLastStep = currentStep === steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-10 w-10 text-primary fill-primary animate-pulse" />
          <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Spaark
          </span>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
            <div className="flex gap-1 mt-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    step.id <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CurrentStepComponent
              data={formData}
              updateData={updateFormData}
              onNext={handleNext}
            />

            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Complete Profile
                  <Heart className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
