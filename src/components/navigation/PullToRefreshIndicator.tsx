import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  shouldTrigger: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  shouldTrigger,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const opacity = Math.min(pullDistance / 80, 1);
  const scale = Math.min(pullDistance / 80, 1);
  const rotation = isRefreshing ? 0 : (pullDistance / 80) * 180;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
      }}
    >
      <div
        className={cn(
          "bg-card/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg",
          shouldTrigger && "bg-primary/10 border-primary"
        )}
        style={{
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <RefreshCw
          className={cn(
            "h-6 w-6 transition-colors",
            isRefreshing && "animate-spin",
            shouldTrigger ? "text-primary" : "text-muted-foreground"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            transition: isRefreshing ? undefined : "transform 0.1s ease-out",
          }}
        />
      </div>
    </div>
  );
}
