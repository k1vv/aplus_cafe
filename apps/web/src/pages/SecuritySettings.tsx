import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Smartphone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, TwoFactorSetupResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSetupTwoFactor = async () => {
    setLoading(true);
    try {
      const { data, error } = await authApi.setupTwoFactor();
      if (error) throw new Error(error);
      if (data) {
        setSetupData(data);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to setup 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;

    setLoading(true);
    try {
      const { error } = await authApi.enableTwoFactor(setupData.secret, verificationCode);
      if (error) throw new Error(error);
      toast.success("Two-factor authentication enabled!");
      setSetupData(null);
      setVerificationCode("");
      refreshUser?.();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authApi.disableTwoFactor(disableCode);
      if (error) throw new Error(error);
      toast.success("Two-factor authentication disabled");
      setShowDisableForm(false);
      setDisableCode("");
      refreshUser?.();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-6 py-4 sm:px-10">
          <Link to="/profile" className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <ArrowLeft className="h-4 w-4" />
            Profile
          </Link>
          <h1 className="text-xl sm:text-2xl font-normal" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Security
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-8">
        {/* 2FA Status Card */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            {user?.twoFactorEnabled ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <ShieldOff className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Two-Factor Authentication
              </h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                {user?.twoFactorEnabled ? "Enabled - Your account is protected" : "Disabled - Add extra security"}
              </p>
            </div>
          </div>

          {!user?.twoFactorEnabled && !setupData && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Add an extra layer of security to your account by requiring a verification code from your authenticator app when signing in.
              </p>
              <Button onClick={handleSetupTwoFactor} disabled={loading} className="w-full text-xs font-bold uppercase tracking-[0.15em]">
                <Shield className="h-4 w-4 mr-2" />
                {loading ? "Loading..." : "Enable 2FA"}
              </Button>
            </div>
          )}

          {user?.twoFactorEnabled && !showDisableForm && (
            <Button
              onClick={() => setShowDisableForm(true)}
              variant="destructive"
              className="w-full text-xs font-bold uppercase tracking-[0.15em]"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable 2FA
            </Button>
          )}

          {showDisableForm && (
            <form onSubmit={handleDisableTwoFactor} className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-800">
                Disabling 2FA will make your account less secure. Enter your current 2FA code to confirm.
              </div>
              <div>
                <Label htmlFor="disableCode" className="text-xs font-bold uppercase tracking-wider mb-2 block">
                  Verification Code
                </Label>
                <Input
                  id="disableCode"
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-xl tracking-[0.5em] font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowDisableForm(false); setDisableCode(""); }}
                  className="flex-1 text-xs font-bold uppercase tracking-[0.15em]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={loading || disableCode.length !== 6}
                  className="flex-1 text-xs font-bold uppercase tracking-[0.15em]"
                >
                  {loading ? "..." : "Disable"}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* 2FA Setup Flow */}
        {setupData && (
          <div className="bg-card rounded-xl border p-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Setup Authenticator App
              </h3>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                Scan the QR code or enter the key manually
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg mb-4 flex justify-center">
              <img src={setupData.qrCodeDataUri} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            {/* Manual Entry Key */}
            <div className="mb-6">
              <Label className="text-xs font-bold uppercase tracking-wider mb-2 block">
                Manual Entry Key
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded text-xs font-mono break-all">
                  {setupData.manualEntryKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleEnableTwoFactor} className="space-y-4">
              <div>
                <Label htmlFor="verifyCode" className="text-xs font-bold uppercase tracking-wider mb-2 block">
                  Enter 6-digit code from your app
                </Label>
                <Input
                  id="verifyCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoComplete="one-time-code"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSetupData(null); setVerificationCode(""); }}
                  className="flex-1 text-xs font-bold uppercase tracking-[0.15em]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 text-xs font-bold uppercase tracking-[0.15em]"
                >
                  {loading ? "Verifying..." : "Enable 2FA"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Email Verification Status */}
        <div className="bg-card rounded-xl border p-6 mt-6">
          <div className="flex items-center gap-3">
            {user?.emailVerified ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
            )}
            <div>
              <h2 className="font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Email Verification
              </h2>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace" }}>
                {user?.emailVerified ? "Your email is verified" : "Please verify your email address"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
