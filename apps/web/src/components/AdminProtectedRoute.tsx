import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Shield, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4"></div>
          <p className="text-sm text-gray-400" style={{ fontFamily: "'Space Mono', monospace" }}>
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Admin Login Required
          </h2>
          <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Please sign in with your admin credentials to access the dashboard.
          </p>
          <Link to="/admin/login" state={{ from: location.pathname }}>
            <Button className="text-xs font-bold uppercase tracking-[0.15em]">
              <Shield className="h-4 w-4 mr-2" />
              Admin Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Access Denied
          </h2>
          <p className="text-sm text-gray-400 mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            You don't have admin privileges. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" className="text-xs font-bold uppercase tracking-[0.15em] border-gray-700 text-gray-300 hover:bg-gray-800">
                Go Home
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button className="text-xs font-bold uppercase tracking-[0.15em]">
                Sign In as Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
