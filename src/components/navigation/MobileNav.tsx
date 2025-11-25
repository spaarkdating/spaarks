import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/spaark-logo.png";

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

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] bg-card border-l border-border">
          <div className="flex flex-col gap-6 mt-8">
            <div className="flex items-center gap-3 px-2 group cursor-pointer">
              <img 
                src={logo} 
                alt="Spaark Logo" 
                className="h-14 w-14 rounded-full bg-background/90 p-1 object-contain drop-shadow-glow shadow-lg shadow-primary/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" 
              />
              <span className="text-2xl font-bold gradient-text">Spaark</span>
            </div>
            
            <nav className="flex flex-col gap-2">
              {defaultLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  onClick={() => {
                    link.onClick?.();
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {link.icon}
                  <span className="text-base font-medium">{link.label}</span>
                </Link>
              ))}
              
              {isAuthenticated && onLogout && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    setOpen(false);
                  }}
                  className="justify-start px-4 py-3 h-auto text-base font-medium hover:bg-muted"
                >
                  Logout
                </Button>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
