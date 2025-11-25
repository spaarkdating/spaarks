import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import logo from "@/assets/spaark-logo.png";

interface HeaderProps {
  showAuthButtons?: boolean;
}

export function Header({ showAuthButtons = true }: HeaderProps) {
  return (
    <header className="container mx-auto px-4 py-4 flex justify-between items-center relative z-20 border-b border-border/30">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-white/90 p-2 rounded-xl shadow-md">
          <img 
            src={logo} 
            alt="Spaark Logo" 
            className="h-10 w-10 md:h-12 md:w-12 object-contain" 
          />
        </div>
        <span className="text-xl md:text-2xl font-bold text-white group-hover:opacity-90 transition-opacity">
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
