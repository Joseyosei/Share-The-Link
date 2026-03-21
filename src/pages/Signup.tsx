import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATES } from "@/pages/TemplatesPage";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const selectedTemplate = templateId ? TEMPLATES.find((t) => t.id === templateId) : null;
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

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

    setIsLoading(true);
    
    // Check if username is already taken
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setErrors({ email: "This email is already registered. Please log in instead." });
        } else {
          setErrors({ email: authError.message });
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from("profiles").upsert({
          user_id: data.user.id,
          username: formData.username,
          full_name: formData.fullName,
          email: formData.email,
        });

        if (selectedTemplate) {
          toast({ 
            title: "Account created!", 
            description: `Welcome! The "${selectedTemplate.name}" template will be applied.` 
          });
        } else {
          toast({ title: "Account created!", description: "Welcome to Share The Link." });
        }
        
        navigate("/dashboard");
      }
    } catch (err) {
      setErrors({ email: "An unexpected error occurred. Please try again." });
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
