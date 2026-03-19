import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, Mail, Loader2, AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step 1: Request reset email
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Step 2: Set new password (when user clicks the reset link)
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user came from a password reset link
  useEffect(() => {
    const checkSession = async () => {
      // Check URL hash for recovery token (Supabase sends this in the URL)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");
      
      if (type === "recovery" && accessToken) {
        // User clicked the reset link - they have a recovery session
        setIsRecoveryMode(true);
      }
      
      setCheckingAuth(false);
    };
    
    // Listen for auth state changes (including recovery tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
      setCheckingAuth(false);
    });

    checkSession();
    
    return () => subscription.unsubscribe();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle sending password reset email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    if (!email) {
      setEmailError("Please enter your email address");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setSendingEmail(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    
    setSendingEmail(false);
    
    if (error) {
      // Don't reveal if email exists or not for security
      if (error.message.includes("rate limit")) {
        setEmailError("Too many requests. Please wait a few minutes and try again.");
      } else if (error.message.includes("Email rate limit exceeded")) {
        setEmailError("Email rate limit exceeded. Please wait 60 seconds before trying again.");
        setResendCooldown(60);
      } else {
        // Always show success even if email doesn't exist (security best practice)
        setEmailSent(true);
      }
      return;
    }
    
    setEmailSent(true);
    setResendCooldown(60); // 60 second cooldown for resend
    toast({
      title: "Check your email",
      description: "We've sent you a password reset link.",
    });
  };

  // Handle resending the email
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setSendingEmail(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    
    setSendingEmail(false);
    
    if (error) {
      if (error.message.includes("rate limit") || error.message.includes("Email rate limit")) {
        toast({
          title: "Rate limited",
          description: "Please wait a minute before requesting another email.",
          variant: "destructive",
        });
        setResendCooldown(60);
      }
      return;
    }
    
    setResendCooldown(60);
    toast({
      title: "Email resent",
      description: "We've sent another password reset link to your email.",
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "Please enter a new password";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: formData.newPassword
    });
    
    setIsLoading(false);
    
    if (error) {
      setErrors({ newPassword: error.message });
      return;
    }
    
    // Sign out the user so they can log in with new password
    await supabase.auth.signOut();
    
    setIsSuccess(true);
    toast({
      title: "Password updated!",
      description: "Your password has been successfully changed.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  // Step 1: Request password reset email
  if (!isRecoveryMode && !emailSent) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <Logo textClassName="text-primary-foreground" />
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {emailError && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={sendingEmail}
                className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Help section */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <HelpCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Need help?</p>
                  <p>
                    If you're having trouble resetting your password, please contact us at{" "}
                    <a href="mailto:support@sharethelink.io" className="text-primary hover:underline">
                      support@sharethelink.io
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 1b: Email sent confirmation
  if (!isRecoveryMode && emailSent) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <Logo textClassName="text-primary-foreground" />
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>
            
            <div className="bg-muted rounded-xl p-4 mb-6 text-sm text-muted-foreground text-left">
              <p className="mb-2 font-medium">Didn't receive the email?</p>
              <ul className="space-y-1">
                <li>- Check your spam or junk folder</li>
                <li>- Make sure you entered the correct email</li>
                <li>- Wait a few minutes and try again</li>
              </ul>
            </div>

            {/* Resend button */}
            <Button
              onClick={handleResendEmail}
              disabled={sendingEmail || resendCooldown > 0}
              variant="outline"
              className="w-full py-6 text-lg font-semibold mb-3"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resend Email
                </>
              )}
            </Button>
            
            <Button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
              }}
              variant="ghost"
              className="w-full py-6 text-lg font-semibold"
            >
              Try a different email
            </Button>

            {/* Help section */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-start gap-3 text-sm text-muted-foreground text-left">
                <HelpCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Still not receiving emails?</p>
                  <p>
                    Contact our support team at{" "}
                    <a href="mailto:support@sharethelink.io" className="text-primary hover:underline">
                      support@sharethelink.io
                    </a>{" "}
                    and we'll help you regain access to your account.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: User clicked reset link - show password reset form
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <Logo textClassName="text-primary-foreground" />
          </Link>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
          {!isSuccess ? (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="New password"
                      value={formData.newPassword}
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
                  {errors.newPassword && (
                    <p className="text-destructive text-sm mt-1">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-sm font-medium text-foreground mb-2">Password requirements:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className={formData.newPassword.length >= 8 ? "text-green-600" : ""}>
                      - At least 8 characters
                    </li>
                    <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "text-green-600" : ""}>
                      - Passwords match
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Password Updated!</h1>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully changed. You can now log in with your new password.
              </p>
              <Button
                asChild
                className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
              >
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          )}

          {!isSuccess && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
