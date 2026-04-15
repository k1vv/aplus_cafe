import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const { error } = await authApi.verifyEmail(token);
        if (error) {
          throw new Error(error);
        }
        setStatus("success");
        toast.success("Email verified successfully!");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify email. The link may have expired.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Email Verification
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Verifying Your Email
              </h2>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Email Verified!
              </h2>
              <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
                Your email has been successfully verified. You can now enjoy all features of APlus Cafe.
              </p>
              <Button onClick={() => navigate("/")} className="text-xs font-bold uppercase tracking-[0.15em]">
                Continue to Home
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Verification Failed
              </h2>
              <p className="text-sm text-muted-foreground mb-6" style={{ fontFamily: "'Space Mono', monospace" }}>
                {errorMessage}
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate("/auth")} className="text-xs font-bold uppercase tracking-[0.15em]">
                  <Mail className="h-4 w-4 mr-2" />
                  Sign In to Resend
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="text-xs font-bold uppercase tracking-[0.15em]">
                  Go Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
