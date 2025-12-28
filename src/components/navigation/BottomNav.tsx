import { useLocation, useNavigate } from "react-router-dom";
import { Home, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/dashboard", label: "Discover", icon: Heart },
    { to: "/matches", label: "Matches", icon: Home },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Only show on authenticated routes
  const authenticatedRoutes = ["/dashboard", "/matches", "/messages", "/profile", "/settings", "/profile-views"];
  const shouldShow = authenticatedRoutes.some(route => location.pathname.startsWith(route));

  if (!shouldShow) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                active 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-current")} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
