import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletionProps {
  profile: any;
  photos: any[];
  interests: any[];
}

const ProfileCompletion = ({ profile, photos, interests }: ProfileCompletionProps) => {
  const checks = [
    { label: "Profile photo added", completed: photos.length >= 1 },
    { label: "2+ photos uploaded", completed: photos.length >= 2 },
    { label: "Bio written", completed: !!profile?.bio && profile.bio.length >= 20 },
    { label: "Interests selected", completed: interests.length >= 3 },
    { label: "Location added", completed: !!profile?.location },
    { label: "Date of birth added", completed: !!profile?.date_of_birth },
    { label: "Gender specified", completed: !!profile?.gender },
    { label: "Looking for specified", completed: !!profile?.looking_for },
  ];

  const completedCount = checks.filter(c => c.completed).length;
  const percentage = Math.round((completedCount / checks.length) * 100);

  return (
    <Card className="shadow-lg border-2 border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Profile Completion</h3>
          <span className="text-2xl font-bold text-primary">{percentage}%</span>
        </div>
        
        <Progress value={percentage} className="h-3" />
        
        <div className="grid gap-2">
          {checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {check.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={check.completed ? "text-sm" : "text-sm text-muted-foreground"}>
                {check.label}
              </span>
            </div>
          ))}
        </div>

        {percentage < 100 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Complete your profile to increase your visibility and match potential!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletion;