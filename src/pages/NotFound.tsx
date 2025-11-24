import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/navigation/Header";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <h1 className="mb-4 text-6xl font-bold gradient-text">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
