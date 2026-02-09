import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCarouselProps {
  photos: { photo_url: string; display_order: number }[];
  initialIndex?: number;
  onClose?: () => void;
}

export const PhotoCarousel = ({ photos, initialIndex = 0, onClose }: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsZoomed(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsZoomed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "Escape" && onClose) onClose();
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center bg-background/95"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-50 bg-background/80 hover:bg-background"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-14 z-50 bg-background/80 hover:bg-background"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
      </Button>

      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 z-40 bg-background/80 hover:bg-background"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 z-40 bg-background/80 hover:bg-background"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full h-full flex items-center justify-center"
        >
          <motion.img
            src={photos[currentIndex].photo_url}
            alt={`Photo ${currentIndex + 1}`}
            className="max-w-full max-h-[65vh] object-contain rounded-lg cursor-zoom-in"
            animate={{
              scale: isZoomed ? 1.5 : 1,
            }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsZoomed(!isZoomed)}
            drag={isZoomed}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
          />
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {photos.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/50"
              }`}
              onClick={() => {
                setCurrentIndex(index);
                setIsZoomed(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
