import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { useSignIn } from "@clerk/clerk-react";

type ResetStep = "email" | "code" | "newPassword" | "success";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [clerkTimedOut, setClerkTimedOut] = useState(false);

  // Timeout for Clerk loading
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setClerkTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Authentication is loading. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("code");
      toast({ title: "Code sent!", description: "Check your email for the reset code." });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || "Failed to send reset code";
      const errorCode = clerkError.errors?.[0]?.code;
      
      if (errorCode === "form_identifier_not_found") {
        setError("No account found with this email address.");
      } else if (errorMessage.includes("rate")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (result.status === "needs_new_password") {
        setStep("newPassword");
      } else {
        setError("Unable to verify code. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || "Invalid verification code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setStep("success");
        toast({ title: "Password reset!", description: "Your password has been changed successfully." });
      } else {
        setError("Unable to reset password. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || "Failed to reset password";
      const errorCode = clerkError.errors?.[0]?.code;
      
      if (errorCode === "form_password_pwned") {
        setError("This password has been compromised in a data breach. Please choose a different one.");
      } else if (errorCode === "form_password_length_too_short") {
        setError("Password must be at least 8 characters.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while Clerk loads, but not forever
  if (!isLoaded && !clerkTimedOut) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/"><Logo textClassName="text-primary-foreground" /></Link>
          </div>
          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Complete</h1>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully reset. You are now logged in.
            </p>
            <Button 
              onClick={() => window.location.href = "/dashboard"}
              className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
            >
              Go to Dashboard
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
        <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
          {step === "email" && (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your email address and we'll send you a code to reset your password.
              </p>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
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
                  ) : "Send Reset Code"}
                </Button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-muted-foreground">
                  We've sent a verification code to <strong>{email}</strong>
                </p>
              </div>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(""); }}
                  placeholder="Enter verification code"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || code.length < 6} 
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
              <button
                onClick={() => { setStep("email"); setCode(""); setError(""); }}
                className="flex items-center justify-center gap-2 mt-4 text-muted-foreground hover:text-foreground transition-colors w-full text-sm"
              >
                <ArrowLeft className="w-4 h-4" />Try a different email
              </button>
            </>
          )}

          {step === "newPassword" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-2">Create new password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your new password below.
              </p>
              {error && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="New password"
                    className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Confirm new password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Password must be at least 8 characters.</p>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Resetting password...
                    </span>
                  ) : "Reset Password"}
                </Button>
              </form>
            </>
          )}

          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
