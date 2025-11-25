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
          className="h-16 w-16 md:h-20 md:w-20 object-contain filter drop-shadow-[0_0_12px_rgba(236,72,153,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]" 
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
