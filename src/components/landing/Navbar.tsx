import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
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
                to="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-2 pt-3 border-t border-border/40">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
