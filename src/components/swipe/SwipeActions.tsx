import { Button } from "@/components/ui/button";
import { X, Heart, Star } from "lucide-react";

interface SwipeActionsProps {
  onDislike: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  disabled?: boolean;
}

export const SwipeActions = ({ onDislike, onLike, onSuperLike, disabled }: SwipeActionsProps) => {
  return (
    <div className="flex justify-center gap-4">
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
        onClick={onDislike}
        disabled={disabled}
      >
        <X className="h-6 w-6" />
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-16 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        onClick={onSuperLike}
        disabled={disabled}
      >
        <Star className="h-7 w-7 fill-current" />
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        onClick={onLike}
        disabled={disabled}
      >
        <Heart className="h-6 w-6 fill-current" />
      </Button>
    </div>
  );
};
