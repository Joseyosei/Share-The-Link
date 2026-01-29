import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user came from a password reset link (they'll have a session)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setCheckingAuth(false);
    };
    
    // Listen for auth state changes (including recovery tokens)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsAuthenticated(true);
      }
      setCheckingAuth(false);
    });

    checkSession();
    
    return () => subscription.unsubscribe();
  }, []);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  // If not authenticated, show message to use login page
  if (!isAuthenticated && !isSuccess) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/">
              <Logo textClassName="text-primary-foreground" />
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
            <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
            <p className="text-muted-foreground mb-6">
              To reset your password, please log in first and then update your password from your account settings.
            </p>
            
            <Button
              asChild
              className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
            >
              <Link to="/login">Go to Login</Link>
            </Button>

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
                      • At least 8 characters
                    </li>
                    <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? "text-green-600" : ""}>
                      • Passwords match
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90"
                >
                  {isLoading ? "Updating..." : "Reset Password"}
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
