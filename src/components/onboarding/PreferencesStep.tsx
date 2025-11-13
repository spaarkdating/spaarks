import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface PreferencesStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const PreferencesStep = ({ data, updateData }: PreferencesStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Almost done!</h3>
        <p className="text-muted-foreground">
          Help us find the best matches for you
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={data.location || ""}
          onChange={(e) => updateData({ location: e.target.value })}
          placeholder="City, Country"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lookingFor">I'm looking for *</Label>
        <Select 
          value={data.lookingFor || ""} 
          onValueChange={(value) => updateData({ lookingFor: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="What are you looking for?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="men">Men</SelectItem>
            <SelectItem value="women">Women</SelectItem>
            <SelectItem value="everyone">Everyone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-2">
        <h4 className="font-semibold text-sm">Privacy & Safety</h4>
        <p className="text-xs text-muted-foreground">
          Your profile will only be shown to users who match your preferences. 
          You can update these settings anytime in your profile settings.
        </p>
      </div>
    </div>
  );
};
