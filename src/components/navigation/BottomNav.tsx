import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { checkUserVerificationStatus } from "@/hooks/useVerificationGuard";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const navItems = [
    { to: "/dashboard", label: "Discover", icon: Heart },
    { to: "/matches", label: "Matches", icon: Users },
    { to: "/messages", label: "Messages", icon: MessageCircle },
    { to: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Only show on authenticated routes
  const authenticatedRoutes = ["/dashboard", "/matches", "/messages", "/profile", "/settings", "/profile-views", "/who-liked-you"];
  const shouldShow = authenticatedRoutes.some((route) => location.pathname.startsWith(route));

  // Check verification status
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsVerified(false);
        return;
      }
      
      setUserId(session.user.id);
      const { isVerified: verified } = await checkUserVerificationStatus(session.user.id);
      setIsVerified(verified);
    };

    if (shouldShow) {
      checkStatus();
    }
  }, [shouldShow, location.pathname]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const { isVerified: verified } = await checkUserVerificationStatus(session.user.id);
        setIsVerified(verified);
      } else {
        setIsVerified(false);
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show if not on authenticated route or if user is not verified
  if (!shouldShow || isVerified === false) return null;
  
  // Still loading verification status - don't show to prevent flash
  if (isVerified === null) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center justify-center transition-all gap-0.5",
                active
                  ? "w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "w-12 h-12 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-current")} />
              {!active && (
                <span className="text-[10px] font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
