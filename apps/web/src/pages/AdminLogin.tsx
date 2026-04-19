import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Shield, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  // Redirect already logged-in users based on their role
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.role === "RIDER") {
        navigate("/rider/dashboard", { replace: true });
      } else {
        // Regular user - go to home
        navigate("/", { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authApi.login(form.email, form.password);
      if (error) throw new Error(error);

      if (data) {
        // Check if user has admin role
        if (data.user.role !== 'ADMIN') {
          toast.error("Access denied. Admin credentials required.");
          setLoading(false);
          return;
        }

        login(data.user, data.accessToken);
        toast.success("Welcome back, Admin!");
        navigate("/admin", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
      {loading && <LoadingOverlay message="Signing in..." />}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            APlus Admin
          </h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "'Space Mono', monospace" }}>
            Staff portal access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#242424] rounded-2xl border border-gray-800 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Admin Sign In
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@gmail.com"
                required
                className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
                <Lock className="h-3.5 w-3.5" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-bold uppercase tracking-[0.15em]"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sign In to Dashboard
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500" style={{ fontFamily: "'Space Mono', monospace" }}>
              Not an admin?{" "}
              <Link to="/" className="text-primary hover:underline">
                Go to main site
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-600 mt-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          Authorized personnel only. All activities are logged.
        </p>
      </div>
    </div>
  );
}
