import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bike, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function RiderLogin() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");

  // Redirect already logged-in users based on their role
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "RIDER") {
        navigate("/rider/dashboard", { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        // Regular user - go to home
        navigate("/", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: apiError } = await authApi.login(email, password);

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    if (data) {
      // Check if user is a rider
      if (data.user.role !== "RIDER") {
        setError("This login is for riders only. Please use the customer login.");
        setLoading(false);
        return;
      }

      // Store token and update auth context
      localStorage.setItem("aplus_refresh_token", data.refreshToken);
      login(data.user, data.accessToken);

      // Redirect to rider dashboard
      navigate("/rider/dashboard", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-orange-500/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-normal mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            APlus Rider
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            Delivery Partner Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <h2 className="text-lg font-bold mb-6 text-center">Rider Login</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@apluscafe.com"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-bold uppercase tracking-wider"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Demo Credentials
            </p>
            <div className="space-y-1 text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
              <p><span className="text-muted-foreground">Email:</span> ahmad.rider@apluscafe.com</p>
              <p><span className="text-muted-foreground">Password:</span> admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Back to APlus Cafe
          </Link>
        </div>
      </div>
    </div>
  );
}
