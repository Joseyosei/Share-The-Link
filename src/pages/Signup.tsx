import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
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
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [clerkTimedOut, setClerkTimedOut] = useState(false);

  // Timeout for Clerk loading
  useEffect(() => {
    if (isLoaded) return;
    const timer = setTimeout(() => setClerkTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [isSignedIn, navigate]);

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
      setErrors({ email: "Authentication is loading. Please try again." });
      return;
    }

    setIsLoading(true);
    
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

    try {
      await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(" ")[0],
        lastName: formData.fullName.split(" ").slice(1).join(" ") || undefined,
        unsafeMetadata: {
          username: formData.username,
          full_name: formData.fullName,
        },
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      toast({ title: "Verification code sent", description: "Please check your email for the verification code." });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string; code: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || "An error occurred during sign up";
      const errorCode = clerkError.errors?.[0]?.code;
      
      if (errorCode === "form_identifier_exists") {
        setErrors({ email: "This email is already registered. Please log in instead." });
      } else if (errorCode === "form_password_pwned") {
        setErrors({ password: "This password has been compromised. Please choose a different one." });
      } else {
        setErrors({ email: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Apply template if selected (after user is authenticated)
        if (selectedTemplate) {
          toast({ 
            title: "Account created!", 
            description: `Welcome! The "${selectedTemplate.name}" template will be applied.` 
          });
        } else {
          toast({ title: "Account created!", description: "Welcome to Share The Link." });
        }
        
        navigate("/dashboard");
      } else {
        setErrors({ email: "Verification incomplete. Please try again." });
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const errorMessage = clerkError.errors?.[0]?.message || "Invalid verification code";
      setErrors({ email: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = name === "username" ? value.toLowerCase().replace(/[^a-z0-9]/g, "") : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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

  // Verification code screen
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
                We've sent a verification code to <strong>{formData.email}</strong>
              </p>
            </div>
            {errors.email && <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">{errors.email}</div>}
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center text-2xl tracking-widest"
                maxLength={6}
              />
              <Button type="submit" disabled={isLoading || verificationCode.length < 6} className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </span>
                ) : "Verify Email"}
              </Button>
            </form>
            <button
              onClick={() => setPendingVerification(false)}
              className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ArrowLeft className="w-4 h-4" />Back to signup
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
          <Link to="/"><Logo textClassName="text-primary-foreground" /></Link>
        </div>
        <div className="bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
          {selectedTemplate && (
            <div className={`mb-4 p-3 rounded-xl ${selectedTemplate.bg} flex items-center gap-3`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className={`text-xs font-bold ${selectedTemplate.textColor}`}>{selectedTemplate.avatar}</span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${selectedTemplate.textColor}`}>Using "{selectedTemplate.name}" template</p>
                <p className={`text-xs ${selectedTemplate.textColor} opacity-70`}>{selectedTemplate.description}</p>
              </div>
            </div>
          )}
          {clerkTimedOut && !isLoaded && (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 mb-6">
              Authentication service is taking longer than expected to load. Please refresh the page or try again later.
            </div>
          )}
          <p className="text-muted-foreground mb-6">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></p>
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
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors[field.name] ? "border-destructive" : "border-border"}`} 
                  />
                </div>
                {field.name === "username" && formData.username && <p className="text-sm text-muted-foreground mt-1">sharethelink.com/{formData.username}</p>}
                {errors[field.name] && <p className="text-destructive text-sm mt-1">{errors[field.name]}</p>}
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
                  className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.password ? "border-destructive" : "border-border"}`} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full py-6 text-lg font-semibold gradient-button text-primary-foreground hover:opacity-90">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </Button>
          </form>
          <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
