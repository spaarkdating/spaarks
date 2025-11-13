import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BasicInfoStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const BasicInfoStep = ({ data, updateData }: BasicInfoStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name *</Label>
        <Input
          id="displayName"
          value={data.displayName || ""}
          onChange={(e) => updateData({ displayName: e.target.value })}
          placeholder="How should we call you?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio *</Label>
        <Textarea
          id="bio"
          value={data.bio || ""}
          onChange={(e) => updateData({ bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">
          {data.bio?.length || 0}/500 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label>Date of Birth *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !data.dateOfBirth && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.dateOfBirth ? format(new Date(data.dateOfBirth), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.dateOfBirth ? new Date(data.dateOfBirth) : undefined}
              onSelect={(date) => updateData({ dateOfBirth: date?.toISOString() })}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender *</Label>
        <Select value={data.gender || ""} onValueChange={(value) => updateData({ gender: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your gender" />
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
    </div>
  );
};
