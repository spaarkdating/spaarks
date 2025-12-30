import { useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const shouldShow = authenticatedRoutes.some((route) => location.pathname.startsWith(route));

  if (!shouldShow) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-24 px-4 max-w-lg mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          const isFirst = idx === 0;

          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              className={cn(
                "flex items-center justify-center transition-all",
                isFirst && active
                  ? "w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : active
                    ? "w-14 h-14 rounded-full bg-primary/10 text-primary"
                    : "w-14 h-14 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-7 w-7", active && "fill-current")} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
