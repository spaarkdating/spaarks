import { useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/spaark-logo.png";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/dashboard", label: "Discover", icon: Heart },
    { to: "/matches", label: "Matches", icon: Users },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Only show on authenticated routes
  const authenticatedRoutes = ["/dashboard", "/matches", "/messages", "/profile", "/settings", "/profile-views"];
  const shouldShow = authenticatedRoutes.some(route => location.pathname.startsWith(route));

  if (!shouldShow) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-20 px-4 max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const isFirst = idx === 0;
          
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "flex items-center justify-center transition-all",
                isFirst && active
                  ? "w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : active
                    ? "w-12 h-12 rounded-full bg-primary/10 text-primary"
                    : "w-12 h-12 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                active ? "h-6 w-6" : "h-6 w-6",
                active && "fill-current"
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
