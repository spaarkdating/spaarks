import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/spaark-logo.png";
import { motion } from "framer-motion";

interface MobileNavProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
  links?: Array<{
    to: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  }>;
}

export function MobileNav({ isAuthenticated = false, onLogout, links = [] }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const defaultLinks = isAuthenticated
    ? links
    : [
        { to: "/auth", label: "Log In" },
        { to: "/auth", label: "Sign Up" },
      ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors duration-200">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] bg-card/95 backdrop-blur-xl border-l border-border/50 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-border/50">
              <div className="bg-background p-2 rounded-xl shadow-md">
                <img 
                  src={logo} 
                  alt="Spaark Logo" 
                  className="h-8 w-8 object-contain" 
                />
              </div>
              <span className="text-xl font-display font-bold text-foreground">Spaark</span>
            </div>
            
            {/* Navigation Links */}
            <motion.nav 
              className="flex flex-col gap-1 p-4 flex-1"
              variants={containerVariants}
              initial="hidden"
              animate={open ? "show" : "hidden"}
            >
              {defaultLinks.map((link, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Link
                    to={link.to}
                    onClick={() => {
                      link.onClick?.();
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-3 px-4 py-4 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      {link.icon && <span className="text-muted-foreground group-hover:text-primary transition-colors">{link.icon}</span>}
                      <span className="text-base font-medium text-foreground">{link.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            
            {/* Footer Actions */}
            {isAuthenticated && onLogout && (
              <div className="p-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    setOpen(false);
                  }}
                  className="w-full justify-start gap-3 px-4 py-4 h-auto text-base font-medium hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
