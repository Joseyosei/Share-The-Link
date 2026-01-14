import { Link } from "react-router-dom";
import { Link2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-primary-foreground">
              Share The Link
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Pricing
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/signup">Sign up free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-primary-foreground p-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/10">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-primary-foreground/10">
                <Button variant="ghost" asChild className="w-full text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Link to="/signup">Sign up free</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
