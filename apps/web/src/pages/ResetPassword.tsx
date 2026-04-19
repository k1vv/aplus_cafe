import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "success" | "error">(token ? "form" : "error");
  const [errorMessage, setErrorMessage] = useState(token ? "" : "Invalid reset link. No token provided.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authApi.resetPassword(token!, password);
      if (error) throw new Error(error);
      setStatus("success");
      toast.success("Password reset successfully!");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between px-6 py-4 sm:px-10">
            <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
                APlus
              </h1>
            </Link>
            <div className="w-16" />
          </div>
        </header>

        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Password Updated!
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button onClick={() => navigate("/auth")} className="text-xs font-bold uppercase tracking-[0.15em]">
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between px-6 py-4 sm:px-10">
            <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <Link to="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
                APlus
              </h1>
            </Link>
            <div className="w-16" />
          </div>
        </header>

        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Reset Failed
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/forgot-password")} className="text-xs font-bold uppercase tracking-[0.15em]">
              Request New Link
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")} className="text-xs font-bold uppercase tracking-[0.15em]">
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {loading && <LoadingOverlay message="Resetting password..." />}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/auth" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              APlus
            </h1>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Create New Password
          </h2>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            Enter a new password for your account. Make it strong!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lock className="h-3.5 w-3.5" />
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
              maxLength={128}
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lock className="h-3.5 w-3.5" />
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              minLength={8}
              maxLength={128}
              className="text-sm"
            />
          </div>

          <Button type="submit" className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
