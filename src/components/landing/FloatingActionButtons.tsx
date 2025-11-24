import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Sparkles, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const FloatingActionButtons = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-8 right-8 z-50 flex flex-col gap-3"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          {/* Scroll to Top */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-primary via-primary-glow to-accent shadow-glow hover:shadow-hover animate-gradient"
            >
              <ArrowUp className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Get Started */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link to="/auth">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-accent shadow-glow hover:shadow-hover"
              >
                <Heart className="h-6 w-6 fill-current" />
              </Button>
            </Link>
          </motion.div>

          {/* View Testimonials */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link to="/testimonials">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-gradient-to-r from-accent to-primary shadow-glow hover:shadow-hover"
              >
                <Sparkles className="h-6 w-6" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
