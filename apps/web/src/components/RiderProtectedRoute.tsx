import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RiderProtectedRouteProps {
  children: React.ReactNode;
}

export default function RiderProtectedRoute({ children }: RiderProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/rider/login" replace />;
  }

  // Check if user is a rider
  if (user?.role !== "RIDER") {
    return <Navigate to="/rider/login" replace />;
  }

  return <>{children}</>;
}
