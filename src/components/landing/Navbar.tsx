import { Link } from "react-router-dom";
import { Menu, X, Sun, Moon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
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
        className={`w-full max-w-3xl rounded-full border border-border/60 bg-background/80 backdrop-blur-xl shadow-lg transition-all duration-300 ${
          scrolled ? "shadow-xl border-border" : ""
        }`}
      >
        <div className="flex items-center justify-between h-14 px-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo textClassName="text-foreground" size="sm" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/templates"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Templates
            </Link>
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 font-medium"
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
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link to="/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5 font-medium"
                >
                  <Link to="/signup">Join for free</Link>
                </Button>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-foreground p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden px-6 pb-5 pt-2 border-t border-border/40">
            <div className="flex flex-col gap-3">
              <Link
                to="/features"
                className="text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/templates"
                className="text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Templates
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/docs"
                className="text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Docs
              </Link>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
                {isSignedIn ? (
                  <Button
                    asChild
                    className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
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
                      className="w-full justify-center text-muted-foreground"
                    >
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium"
                    >
                      <Link to="/signup" onClick={() => setIsOpen(false)}>
                        Join for free
                      </Link>
                    </Button>
                  </>
                )}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
