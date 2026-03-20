import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES } from "@/pages/TemplatesPage";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const selectedTemplate = templateId ? TEMPLATES.find((t) => t.id === templateId) : null;
  const { toast } = useToast();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const verifyingRef = useRef(false);

  // Timeout for Clerk loading
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setClerkTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [isSignedIn, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3) newErrors.username = "Username must be at least 3 characters";
    else if (!/^[a-z0-9]+$/.test(formData.username)) newErrors.username = "Lowercase letters and numbers only";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "At least 8 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isLoaded || !signUp) {
      setErrors({ email: "Authentication service is still loading. Please wait a moment and try again." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Check if username is already taken in Supabase
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", formData.username)
        .maybeSingle();

      if (existingUser) {
        setErrors({ username: "This username is already taken" });
        setIsLoading(false);
        return;
      }

      // Create the Clerk signup — use the RETURN VALUE, not the hook object
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(" ")[0],
        lastName: formData.fullName.split(" ").slice(1).join(" ") || undefined,
        unsafeMetadata: {
          username: formData.username,
          full_name: formData.fullName,
        },
      });

      // If signup is immediately complete (no verification required)
      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          showWelcomeToast();
          window.location.href = "/dashboard";
        } else {
          // Complete but no session — shouldn't happen, but handle it
          setErrors({ email: "Account created but session failed. Please log in." });
          setTimeout(() => { window.location.href = "/login"; }, 2000);
        }
        return;
      }

      // Email verification is required — prepare verification
      if (result.status === "missing_requirements" || result.unverifiedFields?.includes("email_address")) {
        try {
          await result.prepareEmailAddressVerification({ strategy: "email_code" });
          setPendingVerification(true);
          setResendCooldown(30);
          toast({ title: "Verification code sent", description: "Check your email for the code." });
        } catch (prepareErr) {
          console.error("Failed to prepare email verification:", prepareErr);
          setErrors({ email: "Failed to send verification email. Please try again." });
        }
        return;
      }

      // Some other status we don't expect
      console.error("Unexpected signup status:", result.status);
      setErrors({ email: "Something went wrong. Please try again." });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string; longMessage?: string }> };
      const firstError = clerkError.errors?.[0];
      const errorCode = firstError?.code;
      const errorMessage = firstError?.longMessage || firstError?.message || "An error occurred during sign up";

      if (errorCode === "form_identifier_exists") {
        setErrors({ email: "This email is already registered. Please log in instead." });
      } else if (errorCode === "form_password_pwned") {
        setErrors({ password: "This password has been found in a data breach. Please choose a different one." });
      } else if (errorCode === "form_password_length_too_short") {
        setErrors({ password: "Password must be at least 8 characters." });
      } else if (errorCode === "form_password_not_strong_enough") {
        setErrors({ password: "Please choose a stronger password." });
      } else if (errorMessage.toLowerCase().includes("rate") || errorMessage.toLowerCase().includes("too many")) {
        setErrors({ email: "Too many attempts. Please wait a few minutes and try again." });
      } else {
        setErrors({ email: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showWelcomeToast = () => {
    if (selectedTemplate) {
      toast({
        title: "Account created!",
        description: `Welcome! The "${selectedTemplate.name}" template will be applied.`,
      });
    } else {
      toast({ title: "Account created!", description: "Welcome to Share The Link!" });
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp || verifyingRef.current) return;
    verifyingRef.current = true;
    setIsLoading(true);
    setErrors({});

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          showWelcomeToast();
          window.location.href = "/dashboard";
        } else {
          // Account verified but no session — try setting active from signUp
          toast({ title: "Email verified!", description: "Redirecting to dashboard..." });
          window.location.href = "/dashboard";
        }
      } else {
        setErrors({ verification: "Verification incomplete. Please try again." });
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string }> };
      const firstError = clerkError.errors?.[0];
      const errorCode = firstError?.code;
      const errorMessage = firstError?.message || "Invalid verification code";

      if (errorCode === "form_code_incorrect") {
        setErrors({ verification: "Incorrect verification code. Please check and try again." });
      } else if (errorCode === "verification_expired") {
        setErrors({ verification: "Code expired. Please request a new one." });
      } else if (errorMessage.toLowerCase().includes("too many")) {
        setErrors({ verification: "Too many attempts. Please wait a moment and try again." });
      } else {
        setErrors({ verification: errorMessage });
      }
    } finally {
      setIsLoading(false);
      verifyingRef.current = false;
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp || resendCooldown > 0) return;
    setResending(true);
    setErrors({});
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(60);
      toast({ title: "Code resent", description: "A new verification code has been sent to your email." });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      setErrors({ verification: clerkError.errors?.[0]?.message || "Failed to resend code. Please try again." });
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === "username" ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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

  // Email verification screen
  if (pendingVerification) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/"><Logo textClassName="text-primary-foreground" /></Link>
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
            {errors.verification && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{errors.verification}</div>
            )}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.replace(/\D/g, ""));
                  if (errors.verification) setErrors({});
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
                  "Verify & Continue"
                )}
              </Button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={handleResendCode}
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
                setErrors({});
              }}
              className="flex items-center justify-center gap-2 mt-4 text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign up
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          {selectedTemplate && (
            <div className={`mb-4 p-3 rounded-xl ${selectedTemplate.bg} flex items-center gap-3`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className={`text-xs font-bold ${selectedTemplate.textColor}`}>
                  {selectedTemplate.avatar}
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${selectedTemplate.textColor}`}>
                  Using "{selectedTemplate.name}" template
                </p>
                <p className={`text-xs ${selectedTemplate.textColor} opacity-70`}>
                  {selectedTemplate.description}
                </p>
              </div>
            </div>
          )}
          {clerkTimedOut && !isLoaded && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">
              Authentication service is unavailable. Please refresh the page or try again later.
            </div>
          )}
          <p className="text-muted-foreground mb-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: "fullName", placeholder: "Full Name", icon: User, type: "text" },
              { name: "username", placeholder: "Username", icon: User, type: "text" },
              { name: "email", placeholder: "Email", icon: Mail, type: "email" },
            ].map((field) => (
              <div key={field.name}>
                <div className="relative">
                  <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                      errors[field.name] ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>
                {field.name === "username" && formData.username && (
                  <p className="text-sm text-muted-foreground mt-1">
                    sharethelink.app/{formData.username}
                  </p>
                )}
                {errors[field.name] && (
                  <p className="text-destructive text-sm mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                    errors.password ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isLoading || (clerkTimedOut && !isLoaded)}
              className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
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

export default Signup;
