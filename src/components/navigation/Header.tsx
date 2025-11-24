import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeaderProps {
  showAuthButtons?: boolean;
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-20">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary drop-shadow-glow" />
        <span className="text-xl md:text-2xl font-bold gradient-text">
          Spaark
        </span>
      </Link>
      
      {showAuthButtons && (
        <div className="flex gap-3">
          <Link to="/">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
