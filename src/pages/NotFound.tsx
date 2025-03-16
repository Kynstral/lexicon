import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, BookX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthStatusProvider";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  const homeLink = user ? "/dashboard" : "/";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-5 rounded-full">
              <BookX className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tighter mt-6">404</h1>
          <h2 className="text-2xl font-semibold mt-2">Page Not Found</h2>
          <p className="text-muted-foreground mt-4">
            The page you're looking for doesn't exist or has been moved to
            another location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild variant="default" className="gap-2">
            <Link to={homeLink}>
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="#" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        <div className="pt-12 border-t border-border mt-12">
          <p className="text-sm text-muted-foreground">
            If you believe this page should exist, please contact your
            administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
