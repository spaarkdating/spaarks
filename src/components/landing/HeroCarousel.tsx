import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import couple1 from "@/assets/couple-1.png";
import couple2 from "@/assets/couple-2.png";
import couple3 from "@/assets/couple-3.png";
import couple4 from "@/assets/couple-4.png";
import couple5 from "@/assets/couple-5.png";
import couple6 from "@/assets/couple-6.png";

const slides = [
  {
    id: 1,
    title: "Find Your Perfect Match",
    description: "Connect with people who share your values and interests",
    gradient: "from-primary via-primary-glow to-accent",
    images: [couple1, couple2]
  },
  {
    id: 2,
    title: "Start Meaningful Conversations",
    description: "Break the ice with our smart icebreaker suggestions",
    gradient: "from-accent via-primary to-primary-glow",
    images: [couple3, couple4]
  },
  {
    id: 3,
    title: "Build Lasting Relationships",
    description: "Join thousands of happy couples who found love here",
    gradient: "from-primary-glow via-accent to-primary",
    images: [couple5, couple6]
  }
];

export const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    })
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] md:h-[500px] overflow-hidden rounded-3xl">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.3 },
            scale: { duration: 0.3 }
          }}
          className={`absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12 bg-gradient-to-br ${slides[currentSlide].gradient} rounded-3xl`}
        >
          {/* Couple images in circles */}
          <div className="mb-8 flex gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/30 backdrop-blur-sm border-4 border-white/50 shadow-2xl overflow-hidden"
            >
              <img 
                src={slides[currentSlide].images[0]} 
                alt="Happy couple finding love on Spaark dating app" 
                className="w-full h-full object-cover"
                width={128}
                height={128}
                loading={currentSlide === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </motion.div>
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/30 backdrop-blur-sm border-4 border-white/50 shadow-2xl overflow-hidden"
            >
              <img 
                src={slides[currentSlide].images[1]} 
                alt="Romantic couple matched on Spaark" 
                className="w-full h-full object-cover"
                width={128}
                height={128}
                loading={currentSlide === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </motion.div>
          </div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-3xl md:text-5xl font-bold text-white text-center mb-4"
          >
            {slides[currentSlide].title}
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-lg md:text-xl text-white/90 text-center max-w-2xl"
          >
            {slides[currentSlide].description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/30 transition-colors z-10"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/30 transition-colors z-10"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentSlide ? 1 : -1);
              setCurrentSlide(idx);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide
                ? "w-8 bg-white"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
