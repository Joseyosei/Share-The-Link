import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const verifyingRef = useRef(false);
  // Store the emailAddressId for resending
  const emailAddressIdRef = useRef<string | null>(null);

  const getRedirectUrl = () => {
    return (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
  };

  // Timeout for Clerk loading
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setClerkTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate(getRedirectUrl(), { replace: true });
    }
  }, [isSignedIn, navigate, location]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Authentication service is still loading. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Use the RETURN VALUE from signIn.create()
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in. Check your inbox for a confirmation link.");
        } else if (authError.message.includes("Too many requests")) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.session) {
        toast({ title: "Welcome back!", description: "You've successfully logged in." });
        window.location.href = getRedirectUrl();
        return;
      }

      if (result.status === "needs_first_factor") {
        // Check available first factor strategies
        const emailCodeFactor = result.supportedFirstFactors?.find(
          (f: { strategy: string }) => f.strategy === "email_code"
        );

        if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
          emailAddressIdRef.current = emailCodeFactor.emailAddressId as string;
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailAddressIdRef.current,
          });
          setPendingVerification(true);
          setResendCooldown(30);
          toast({ title: "Verification code sent", description: "Check your email for the code." });
        } else {
          setError("Additional verification is required but no supported method is available. Please contact support.");
        }
        return;
      }

      if (result.status === "needs_second_factor") {
        setError("Two-factor authentication is required. Please contact support if you need help.");
        return;
      }

      // Unexpected status
      setError("Login requires additional steps. Please try again or contact support.");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string; longMessage?: string }> };
      const firstError = clerkError.errors?.[0];
      const errorCode = firstError?.code;
      const errorMessage = firstError?.longMessage || firstError?.message || "An error occurred during sign in";

      if (errorCode === "form_password_incorrect") {
        setError("Incorrect password. Please try again or use 'Forgot password?' to reset it.");
      } else if (errorCode === "form_identifier_not_found") {
        setError("No account found with this email. Please check your email or sign up for a new account.");
      } else if (errorCode === "form_identifier_exists") {
        setError("This email is already in use.");
      } else if (errorCode === "strategy_for_user_invalid") {
        setError("This sign-in method is not available for your account. Try 'Forgot password?' to set a new password.");
      } else if (
        errorMessage.toLowerCase().includes("too many") ||
        errorMessage.toLowerCase().includes("rate")
      ) {
        setError("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setError(errorMessage);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn || verifyingRef.current) return;
    verifyingRef.current = true;
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast({ title: "Welcome back!", description: "You've successfully logged in." });
        window.location.href = getRedirectUrl();
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string }> };
      const firstError = clerkError.errors?.[0];
      const errorCode = firstError?.code;
      const errorMessage = firstError?.message || "Invalid verification code";

      if (errorCode === "form_code_incorrect") {
        setError("Incorrect verification code. Please check and try again.");
      } else if (errorCode === "verification_expired") {
        setError("Code expired. Please request a new one.");
      } else if (errorMessage.toLowerCase().includes("too many")) {
        setError("Too many attempts. Please wait before trying again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleResendLoginCode = async () => {
    if (!isLoaded || !signIn || resendCooldown > 0) return;
    setResending(true);
    setError("");

    try {
      if (emailAddressIdRef.current) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailAddressIdRef.current,
        });
        setResendCooldown(60);
        toast({ title: "Code resent", description: "A new code has been sent to your email." });
      } else {
        // Fallback: find the email_code factor from supported factors
        const emailCodeFactor = signIn.supportedFirstFactors?.find(
          (f: { strategy: string }) => f.strategy === "email_code"
        );
        if (emailCodeFactor && "emailAddressId" in emailCodeFactor) {
          emailAddressIdRef.current = emailCodeFactor.emailAddressId as string;
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailAddressIdRef.current,
          });
          setResendCooldown(60);
          toast({ title: "Code resent", description: "A new code has been sent to your email." });
        } else {
          setError("Unable to resend code. Please go back and try logging in again.");
        }
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setError(clerkError.errors?.[0]?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Show loading state while Clerk loads
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

  // Email verification screen for login
  if (pendingVerification) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <Logo textClassName="text-primary-foreground" />
            </Link>
          </div>
          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
              <p className="text-muted-foreground">
                We sent a 6-digit code to <strong>{formData.email}</strong>
              </p>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>
            )}
            <form onSubmit={handleVerifyLogin} className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center text-2xl tracking-widest"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
              />
              <Button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />Verifying...
                  </span>
                ) : (
                  "Verify & Log In"
                )}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handleResendLoginCode}
                disabled={resending || resendCooldown > 0}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {resending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
            </div>
            <button
              onClick={() => {
                setPendingVerification(false);
                setVerificationCode("");
                setError("");
                emailAddressIdRef.current = null;
              }}
              className="flex items-center justify-center gap-2 mt-4 text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <Logo textClassName="text-primary-foreground" />
          </Link>
        </div>
        <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
          {clerkTimedOut && !isLoaded && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">
              Authentication service is unavailable. Please refresh the page or try again later.
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={isLoading || (clerkTimedOut && !isLoaded)}
              className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Log in"
              )}
            </Button>
          </form>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
