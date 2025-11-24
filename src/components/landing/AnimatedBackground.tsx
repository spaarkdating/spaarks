import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export const AnimatedBackground = () => {
  // Generate random positions and animation durations for floating hearts
  const hearts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 15 + Math.random() * 10,
    size: 20 + Math.random() * 30,
    opacity: 0.1 + Math.random() * 0.2,
  }));

  const orbs = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 3,
    duration: 20 + Math.random() * 15,
    size: 100 + Math.random() * 200,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Hearts */}
      {hearts.map((heart) => (
        <motion.div
          key={`heart-${heart.id}`}
          className="absolute"
          style={{
            left: heart.left,
            bottom: -50,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -1200,
            opacity: [0, heart.opacity, heart.opacity, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Heart
            className="text-primary fill-primary"
            style={{
              width: heart.size,
              height: heart.size,
            }}
          />
        </motion.div>
      ))}

      {/* Gradient Orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={`orb-${orb.id}`}
          className="absolute rounded-full blur-3xl"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${
              orb.id % 3 === 0
                ? "hsl(var(--primary) / 0.15)"
                : orb.id % 3 === 1
                ? "hsl(var(--secondary) / 0.15)"
                : "hsl(var(--accent) / 0.15)"
            }, transparent)`,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
