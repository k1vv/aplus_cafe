import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Lock, Bike, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Sign in required
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            You need an account to access this page
          </p>
          <Link to="/auth" state={{ from: location.pathname }}>
            <Button className="text-xs font-bold uppercase tracking-[0.15em]" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Redirect RIDER to their dashboard - they can't access customer pages
  if (user?.role === "RIDER") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Bike className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Rider Account
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            This area is for customers only. Please use your rider dashboard.
          </p>
          <Link to="/rider/dashboard">
            <Button className="text-xs font-bold uppercase tracking-[0.15em]" size="lg">
              <Bike className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Redirect ADMIN to their dashboard - they can't access customer pages
  if (user?.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Admin Account
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            This area is for customers only. Please use your admin dashboard.
          </p>
          <Link to="/admin">
            <Button className="text-xs font-bold uppercase tracking-[0.15em]" size="lg">
              <Shield className="h-4 w-4 mr-2" />
              Go to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
