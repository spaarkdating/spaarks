import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface BasicInfoStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 18; year >= 1940; year--) {
    years.push(year.toString());
  }
  return years;
};

const generateDays = (month: string, year: string) => {
  const daysInMonth = month && year 
    ? new Date(parseInt(year), parseInt(month), 0).getDate() 
    : 31;
  return Array.from({ length: daysInMonth }, (_, i) => 
    (i + 1).toString().padStart(2, "0")
  );
};

export const BasicInfoStep = ({ data, updateData }: BasicInfoStepProps) => {
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  // Parse existing date of birth if available
  useEffect(() => {
    if (data.dateOfBirth) {
      const date = new Date(data.dateOfBirth);
      setDobDay(date.getDate().toString().padStart(2, "0"));
      setDobMonth((date.getMonth() + 1).toString().padStart(2, "0"));
      setDobYear(date.getFullYear().toString());
    }
  }, []);

  // Update combined date when any part changes
  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      const dateStr = `${dobYear}-${dobMonth}-${dobDay}`;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        updateData({ dateOfBirth: date.toISOString() });
      }
    }
  }, [dobDay, dobMonth, dobYear]);

  const years = generateYears();
  const days = generateDays(dobMonth, dobYear);

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
        <div className="grid grid-cols-3 gap-2">
          <Select value={dobDay} onValueChange={setDobDay}>
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dobMonth} onValueChange={setDobMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dobYear} onValueChange={setDobYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          You must be 18 or older to use Spaark
        </p>
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

      <div className="space-y-2">
        <Label htmlFor="datingMode">Dating Preference *</Label>
        <Select value={data.datingMode || "online"} onValueChange={(value) => updateData({ datingMode: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your dating preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online Dating - Meet people virtually first</SelectItem>
            <SelectItem value="offline">Offline Dating - Prefer to meet in person</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          You'll only see profiles of people with the same dating preference
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="height">Height (optional)</Label>
        <Input
          id="height"
          value={data.height || ""}
          onChange={(e) => updateData({ height: e.target.value })}
          placeholder="e.g., 5'8&quot; or 173cm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">Occupation (optional)</Label>
        <Input
          id="occupation"
          value={data.occupation || ""}
          onChange={(e) => updateData({ occupation: e.target.value })}
          placeholder="What do you do?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="college">College/University <span className="text-destructive">*</span></Label>
        <Input
          id="college"
          value={data.college || ""}
          onChange={(e) => updateData({ college: e.target.value })}
          placeholder="e.g., IIT Delhi, MIT, Stanford"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="education">Education (optional)</Label>
        <Select value={data.education || ""} onValueChange={(value) => updateData({ education: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select your education level" />
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
        <Label htmlFor="relationshipGoal">Looking For (optional)</Label>
        <Select value={data.relationshipGoal || ""} onValueChange={(value) => updateData({ relationshipGoal: value })}>
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
          <Select value={data.smoking || ""} onValueChange={(value) => updateData({ smoking: value })}>
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
          <Select value={data.drinking || ""} onValueChange={(value) => updateData({ drinking: value })}>
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
        <Select value={data.religion || ""} onValueChange={(value) => updateData({ religion: value })}>
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
    </div>
  );
};
