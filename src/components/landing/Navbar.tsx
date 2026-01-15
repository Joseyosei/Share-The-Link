import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/">
            <Logo textClassName="text-primary-foreground" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle className="text-primary-foreground hover:bg-primary-foreground/10" />
            <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/signup">Sign up free</Link>
            </Button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-primary-foreground p-2">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/10">
            <div className="flex flex-col gap-4">
              <Link to="/features" className="text-primary-foreground/80 hover:text-primary-foreground py-2" onClick={() => setIsOpen(false)}>Features</Link>
              <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground py-2" onClick={() => setIsOpen(false)}>Pricing</Link>
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
