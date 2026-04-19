import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authApi.forgotPassword(email);
      if (error) throw new Error(error);
      setSubmitted(true);
      toast.success("Reset instructions sent!");
    } catch (error: any) {
      // Still show success to prevent email enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
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

        <div className="max-w-md mx-auto px-6 py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Check Your Email
          </h2>
          <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            If an account exists for <span className="text-foreground font-bold">{email}</span>, we've sent password reset instructions.
          </p>
          <p className="text-xs text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => { setSubmitted(false); setEmail(""); }} variant="outline" className="text-xs font-bold uppercase tracking-[0.15em]">
              Try Different Email
            </Button>
            <Link to="/auth">
              <Button className="w-full text-xs font-bold uppercase tracking-[0.15em]">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Forgot Password?
          </h2>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="text-sm"
            />
          </div>

          <Button type="submit" className="w-full text-xs font-bold uppercase tracking-[0.15em]" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6" style={{ fontFamily: "'Space Mono', monospace" }}>
          Remember your password?{" "}
          <Link to="/auth" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
