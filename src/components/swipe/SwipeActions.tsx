import { Button } from "@/components/ui/button";
import { X, Heart, Star, RotateCcw } from "lucide-react";

interface SwipeActionsProps {
  onDislike: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onRewind?: () => void;
  disabled?: boolean;
  canRewind?: boolean;
}

export const SwipeActions = ({ 
  onDislike, 
  onLike, 
  onSuperLike, 
  onRewind,
  disabled,
  canRewind = false 
}: SwipeActionsProps) => {
  return (
    <div className="flex justify-center items-center gap-4">
      {onRewind && (
        <Button
          size="lg"
          variant="outline"
          className="h-12 w-12 rounded-full border-2 border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 transition-all duration-300 hover:scale-110"
          onClick={onRewind}
          disabled={!canRewind || disabled}
          title="Undo last swipe"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      )}
      
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-destructive/50"
        onClick={onDislike}
        disabled={disabled}
      >
        <X className="h-6 w-6" />
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="h-16 w-16 rounded-full border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-accent/50 animate-pulse-glow"
        onClick={onSuperLike}
        disabled={disabled}
      >
        <Star className="h-7 w-7 fill-current" />
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="h-14 w-14 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-primary/50"
        onClick={onLike}
        disabled={disabled}
      >
        <Heart className="h-6 w-6 fill-current" />
      </Button>
    </div>
  );
};
