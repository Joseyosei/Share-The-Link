import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

type Step = "email" | "otp" | "new-password" | "done";

const OTP_LENGTH = 8;

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) {
        if (resetError.message.includes("rate")) {
          setError("Too many attempts. Please wait a few minutes and try again.");
        } else {
          setError(resetError.message);
        }
        return;
      }

      setStep("otp");
      toast({ title: "Code sent!", description: `Check your email for an ${OTP_LENGTH}-digit verification code.` });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last char
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === 0) return;

    const newOtp = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < OTP_LENGTH; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);

    // Focus the next empty field or the last one
    const nextEmpty = newOtp.findIndex((d) => !d);
    otpRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code`);
      return;
    }

    setIsLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });

      if (verifyError) {
        setError("Invalid or expired code. Please check and try again.");
        return;
      }

      setStep("new-password");
      toast({ title: "Verified!", description: "Now set your new password." });
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sign out so they log in fresh with new password
      await supabase.auth.signOut();
      setStep("done");
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setIsLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      toast({ title: "Code resent!", description: "Check your email for a new code." });
      setOtp(Array(OTP_LENGTH).fill(""));
    } catch {
      setError("Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- DONE screen ----
  if (step === "done") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/"><Logo textClassName="text-primary-foreground" /></Link>
          </div>
          <div className="liquid-glass glass-specular rounded-2xl shadow-2xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><Logo textClassName="text-primary-foreground" /></Link>
        </div>
        <div className="liquid-glass glass-specular rounded-2xl shadow-2xl p-8 animate-scale-in">

          {/* ---- STEP 1: Enter Email ---- */}
          {step === "email" && (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your email and we'll send you a verification code to verify your identity.
              </p>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending code...
                    </span>
                  ) : "Send Verification Code"}
                </Button>
              </form>
            </>
          )}

          {/* ---- STEP 2: Enter OTP ---- */}
          {step === "otp" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Enter Code</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                We sent an {OTP_LENGTH}-digit code to <strong>{email}</strong>. Enter it below.
              </p>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex justify-center gap-1.5 sm:gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || otp.join("").length !== OTP_LENGTH}
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </span>
                  ) : "Verify Code"}
                </Button>
              </form>
              <div className="text-center mt-4">
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
              <button
                onClick={() => { setStep("email"); setError(""); setOtp(Array(OTP_LENGTH).fill("")); }}
                className="flex items-center gap-1 mt-3 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Change email
              </button>
            </>
          )}

          {/* ---- STEP 3: New Password ---- */}
          {step === "new-password" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">New Password</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                Create a new password for your account. Must be at least 8 characters.
              </p>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      placeholder="Enter new password"
                      className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-border bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              newPassword.length >= level * 3
                                ? newPassword.length >= 12
                                  ? "bg-green-500"
                                  : newPassword.length >= 8
                                  ? "bg-yellow-500"
                                  : "bg-red-400"
                                : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {newPassword.length < 8
                          ? `${8 - newPassword.length} more characters needed`
                          : newPassword.length >= 12
                          ? "Strong password"
                          : "Good password"}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Confirm new password"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-destructive text-sm mt-1">Passwords do not match</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </span>
                  ) : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          {/* Back to login - shown on email & otp steps */}
          {(step === "email" || step === "otp") && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />Back to login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
