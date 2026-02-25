import { useNavigate, useLocation, Link } from "react-router-dom";
import { Heart, Users, MessageCircle, User as UserIcon, Settings, LogOut, Filter, Eye, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/spaark-logo.png";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { MobileNav } from "@/components/navigation/MobileNav";

interface AppHeaderProps {
  userId: string;
  onLogout: () => void;
  onFilterClick?: () => void;
  title?: string;
}

export function AppHeader({ userId, onLogout, onFilterClick, title }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "discover", icon: Heart, label: "Discover", path: "/dashboard" },
    { id: "matches", icon: Users, label: "Matches", path: "/matches" },
    { id: "messages", icon: MessageCircle, label: "Messages", path: "/messages" },
    { id: "profile", icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-white/90 rounded-xl flex items-center justify-center shadow-md">
              <img src={logo} alt="Spaark" className="h-7 w-7 md:h-8 md:w-8 object-contain" />
            </div>
            <span className="text-lg md:text-xl font-display font-bold text-foreground hidden sm:block">
              {title || "Spaark"}
            </span>
          </Link>

          {/* Center: Navigation (desktop) */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full transition-all",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={item.label}
              >
                <item.icon className={cn("h-5 w-5", isActive(item.path) && "fill-current")} />
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1.5">
              <NotificationBell userId={userId} />
              {onFilterClick && (
                <button
                  onClick={onFilterClick}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                  title="Filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => navigate("/who-liked-you")}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 text-pink-500 transition-all"
                title="Who Liked You"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/profile-views")}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                title="Profile Views"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <NotificationBell userId={userId} />
              {onFilterClick && (
                <button
                  onClick={onFilterClick}
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card text-muted-foreground"
                  aria-label="Filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              )}
              <MobileNav
                isAuthenticated
                onLogout={onLogout}
                links={[
                  { to: "/who-liked-you", label: "Who Liked You", icon: <Sparkles className="h-5 w-5 text-pink-500" />, onClick: () => navigate("/who-liked-you") },
                  { to: "/profile-views", label: "Profile Views", icon: <Eye className="h-5 w-5" />, onClick: () => navigate("/profile-views") },
                  { to: "/matches", label: "Matches", icon: <Heart className="h-5 w-5" />, onClick: () => navigate("/matches") },
                  { to: "/messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" />, onClick: () => navigate("/messages") },
                  { to: "/profile", label: "Profile", icon: <UserIcon className="h-5 w-5" />, onClick: () => navigate("/profile") },
                  { to: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, onClick: () => navigate("/settings") },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
