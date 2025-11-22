import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCompatibilityLabel, getCompatibilityColor } from "@/lib/compatibility";

interface CompatibilityBadgeProps {
  score: number;
  className?: string;
}

export const CompatibilityBadge = ({ score, className = "" }: CompatibilityBadgeProps) => {
  return (
    <Badge
      variant="secondary"
      className={`gap-1 bg-card/95 backdrop-blur-sm border border-primary/20 ${getCompatibilityColor(score)} ${className}`}
    >
      <Sparkles className="h-3 w-3" />
      {score}% · {getCompatibilityLabel(score)}
    </Badge>
  );
};
