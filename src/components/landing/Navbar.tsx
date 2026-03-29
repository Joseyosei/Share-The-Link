import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon, LayoutDashboard, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsSignedIn(!!session);
      setIsLoaded(true);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
      setIsLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4">
      <div
        className={`w-full max-w-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg transition-all duration-300 ${
          isOpen ? "rounded-2xl" : "rounded-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo textClassName="text-white" size="sm" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/templates"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Templates
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/media"
              className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Media Hub
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-white text-gray-900 hover:bg-white/90 px-5 font-medium"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-white text-gray-900 hover:bg-white/90 px-5 font-medium"
                >
                  <Link to="/signup">Join for free</Link>
                </Button>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 border-t border-white/15">
            <div className="flex flex-col gap-1">
              <Link
                to="/features"
                className="text-sm text-white/70 hover:text-white py-3 active:bg-white/10 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/templates"
                className="text-sm text-white/70 hover:text-white py-3 active:bg-white/10 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Templates
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-white/70 hover:text-white py-3 active:bg-white/10 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/media"
                className="text-sm text-white/70 hover:text-white py-3 active:bg-white/10 rounded-lg px-2 -mx-2 transition-colors flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Play className="w-3.5 h-3.5" />
                Media Hub
              </Link>
              <div className="flex flex-col gap-2 pt-3 border-t border-white/15">
                {isLoaded && isSignedIn ? (
                  <Button
                    asChild
                    className="w-full rounded-full bg-white text-gray-900 hover:bg-white/90 font-medium"
                  >
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-center text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full rounded-full bg-white text-gray-900 hover:bg-white/90 font-medium"
                    >
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        Join for free
                      </Link>
                    </Button>
                  </>
                )}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
