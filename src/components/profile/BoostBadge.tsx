import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const BoostBadge = () => {
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 animate-pulse-glow"
    >
      <Zap className="h-3 w-3 fill-current" />
      BOOSTED
    </Badge>
  );
};
