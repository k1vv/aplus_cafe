import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });

  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Email verification pending state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Get the page user was trying to access before being redirected to login
  const from = (location.state as { from?: string })?.from || "/";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authApi.verifyTwoFactor(twoFactorToken, twoFactorCode);
      if (error) throw new Error(error);
      if (data) {
        login(data.user, data.accessToken);
        toast.success("Logged in successfully!");
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await authApi.login(form.email, form.password);
        if (error) throw new Error(error);
        if (data) {
          // Check if 2FA is required
          if (data.requiresTwoFactor && data.twoFactorToken) {
            setRequiresTwoFactor(true);
            setTwoFactorToken(data.twoFactorToken);
            setLoading(false);
            return;
          }
          login(data.user, data.accessToken);
          toast.success("Logged in successfully!");
          navigate(from, { replace: true });
        }
      } else {
        const { data, error } = await authApi.register(form.email, form.password, form.fullName);
        if (error) throw new Error(error);
        if (data) {
          // Don't log in immediately - require email verification first
          setPendingVerification(true);
          toast.success("Account created! Please check your email to verify your account.");
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || "An error occurred";
      // If the error is about email verification, show the pending verification screen
      if (errorMsg.toLowerCase().includes("verify your email")) {
        setPendingVerification(true);
        toast.error("Please verify your email first");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const { error } = await authApi.resendVerificationEmail(form.email);
      if (error) throw new Error(error);
      toast.success("Verification email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  // If pending email verification, show the verification pending screen
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between px-6 py-4 sm:px-10">
            <button
              onClick={() => { setPendingVerification(false); setForm({ email: "", password: "", fullName: "" }); }}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Verify Email
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Check Your Email
          </h2>
          <p className="text-sm text-muted-foreground mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
            We've sent a verification link to
          </p>
          <p className="text-sm font-bold mb-6">{form.email}</p>
          <p className="text-xs text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Click the link in the email to verify your account and start using APlus Cafe.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              variant="outline"
              disabled={resendLoading}
              className="w-full text-xs font-bold uppercase tracking-[0.15em]"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              onClick={() => { setPendingVerification(false); setIsLogin(true); }}
              className="w-full text-xs font-bold uppercase tracking-[0.15em]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've Verified - Sign In
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  // If 2FA is required, show the 2FA form
  if (requiresTwoFactor) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between px-6 py-4 sm:px-10">
            <button
              onClick={() => { setRequiresTwoFactor(false); setTwoFactorCode(""); }}
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Verify
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <div className="max-w-md mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Two-Factor Authentication
            </h2>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Shield className="h-3.5 w-3.5" />
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                className="text-sm text-center text-2xl tracking-[0.5em] font-mono"
                autoComplete="one-time-code"
              />
            </div>

            <Button type="submit" className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg" disabled={loading || twoFactorCode.length !== 6}>
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {isLogin ? "Sign In" : "Create Account"}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {isLogin ? "Welcome Back" : "Join APlus"}
          </h2>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            {isLogin ? "Sign in to track your orders" : "Create an account to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <User className="h-3.5 w-3.5" />
                Full Name
              </Label>
              <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" className="text-sm" />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className="text-sm" />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lock className="h-3.5 w-3.5" />
              Password
            </Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} className="text-sm" />
          </div>

          {isLogin && (
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline" style={{ fontFamily: "'Space Mono', monospace" }}>
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
