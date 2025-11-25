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
      <Link to="/" className="flex items-center gap-3 group transition-opacity">
        <img 
          src={logo} 
          alt="Spaark Logo" 
          className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-background/90 p-1 object-contain drop-shadow-glow shadow-lg shadow-primary/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" 
        />
        <span className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-md">
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
