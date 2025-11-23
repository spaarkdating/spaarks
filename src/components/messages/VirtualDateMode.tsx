import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface VirtualDateModeProps {
  startTime: Date;
}

export const VirtualDateMode = ({ startTime }: VirtualDateModeProps) => {
  const [elapsed, setElapsed] = useState("00:00");
  const [hearts, setHearts] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setElapsed(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    // Generate floating hearts periodically
    const heartInterval = setInterval(() => {
      const newHeart = Date.now();
      setHearts((prev) => [...prev, newHeart]);
      
      // Remove heart after animation completes
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h !== newHeart));
      }, 4000);
    }, 2000);

    return () => clearInterval(heartInterval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Romantic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-rose-500/5 to-red-500/5" />
      
      {/* Floating hearts */}
      {hearts.map((heart) => (
        <Heart
          key={heart}
          className="absolute text-rose-500/40 animate-float-heart"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: "-20px",
            animationDuration: `${3 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
          size={20 + Math.random() * 16}
          fill="currentColor"
        />
      ))}

      {/* Timer badge */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <div className="bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur-sm px-4 py-2 rounded-full border border-rose-300/20 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-white animate-heartbeat" fill="currentColor" />
            <span className="text-sm font-semibold text-white tabular-nums">
              {elapsed}
            </span>
          </div>
        </div>
      </div>

      {/* Corner heart decorations */}
      <div className="absolute top-4 left-4 animate-pulse-slow">
        <Heart className="h-6 w-6 text-rose-300/30" fill="currentColor" />
      </div>
      <div className="absolute bottom-4 left-4 animate-pulse-slow" style={{ animationDelay: "1s" }}>
        <Heart className="h-5 w-5 text-pink-300/30" fill="currentColor" />
      </div>
      <div className="absolute bottom-4 right-4 animate-pulse-slow" style={{ animationDelay: "0.5s" }}>
        <Heart className="h-6 w-6 text-rose-300/30" fill="currentColor" />
      </div>

      {/* Sparkle effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,192,203,0.1),transparent_50%)] animate-pulse-slow" />
    </div>
  );
};
