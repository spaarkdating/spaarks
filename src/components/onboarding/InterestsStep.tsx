import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface InterestsStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const InterestsStep = ({ data, updateData }: InterestsStepProps) => {
  const [interests, setInterests] = useState<any[]>([]);
  const selectedInterests = data.interests || [];

  useEffect(() => {
    const fetchInterests = async () => {
      const { data: interestsData } = await supabase
        .from("interests")
        .select("*")
        .order("name");
      
      if (interestsData) {
        setInterests(interestsData);
      }
    };

    fetchInterests();
  }, []);

  const toggleInterest = (interestId: string) => {
    const newInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter((id: string) => id !== interestId)
      : [...selectedInterests, interestId];
    
    updateData({ interests: newInterests });
  };

  const groupedInterests = interests.reduce((acc, interest) => {
    const category = interest.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(interest);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">What are you into?</h3>
        <p className="text-muted-foreground">
          Select at least 3 interests to help us find your perfect match
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {Object.entries(groupedInterests).map(([category, categoryInterests]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {(categoryInterests as any[]).map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <Badge
                    key={interest.id}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? "bg-primary" : "hover:border-primary"
                    }`}
                    onClick={() => toggleInterest(interest.id)}
                  >
                    {interest.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-center text-muted-foreground">
        {selectedInterests.length} interest{selectedInterests.length !== 1 ? "s" : ""} selected
        {selectedInterests.length < 3 && " (select at least 3)"}
      </p>
    </div>
  );
};
