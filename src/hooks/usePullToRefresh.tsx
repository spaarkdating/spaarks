import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
}: UsePullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when scrolled to top
      if (window.scrollY === 0 && container.scrollTop === 0) {
        setCanPull(true);
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 0) {
        // Prevent default scrolling while pulling
        e.preventDefault();
        
        // Apply rubber band effect (diminishing returns as you pull further)
        const actualDistance = Math.min(
          distance * 0.5,
          maxPullDistance
        );
        setPullDistance(actualDistance);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
      
      setCanPull(false);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canPull, pullDistance, threshold, isRefreshing, onRefresh, maxPullDistance]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    shouldTrigger: pullDistance >= threshold,
  };
}
