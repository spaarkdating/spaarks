import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";

interface HeaderProps {
  showAuthButtons?: boolean;
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  return (
    <header className="container mx-auto px-4 py-6 flex justify-between items-center relative z-20 border-b border-border/30">
      <Link to="/" className="flex items-center gap-2 group transition-opacity">
        <img 
          src={logo} 
          alt="Spaark Logo" 
          className="h-12 w-12 md:h-14 md:w-14 object-contain drop-shadow-glow transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" 
        />
        <span className="text-xl md:text-2xl font-bold text-foreground drop-shadow-md">
          Spaark
        </span>
      </Link>
      
      {showAuthButtons && (
        <div className="flex gap-3">
          <Link to="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
