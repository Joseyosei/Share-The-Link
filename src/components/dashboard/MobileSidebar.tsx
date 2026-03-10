import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Link2, 
  Palette, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Menu,
  X,
  Radio,
  Wand2,
  Store,
  Play,
  HelpCircle,
  Shield,
  QrCode,
  CalendarCheck,
  MessageSquareQuote,
  Bot
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/dashboard/links" },
  { icon: Radio, label: "Live Streaming", href: "/streaming", isNew: true },
  { icon: Play, label: "Media", href: "/dashboard/media", isNew: true },
  { icon: Wand2, label: "AI Builder", href: "/ai-builder", isNew: true },
  { icon: Store, label: "My Shop", href: "/connect", isNew: true },
  { icon: CalendarCheck, label: "Bookings", href: "/dashboard/bookings", isNew: true },
  { icon: QrCode, label: "QR Code", href: "/dashboard/qr-code", isNew: true },
  { icon: Palette, label: "Appearance", href: "/dashboard/appearance" },
  { icon: Bot, label: "AI Agent", href: "/dashboard/ai-agent", isNew: true },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageSquareQuote, label: "Reviews", href: "/dashboard/reviews", isNew: true },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

const ADMIN_EMAILS = ["admin@sharethelink.io"];

export const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading } = useUserProfile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true);
        return;
      }
      try {
        const { data } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single();
        if (data) setIsAdmin(true);
      } catch { /* not admin */ }
    };
    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const displayEmail = profile?.email || "user@example.com";

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo textClassName="text-sidebar-foreground" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-foreground z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <Logo textClassName="text-sidebar-foreground" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.isNew && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin Panel link */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mt-2 border border-destructive/20 ${
                location.pathname === "/admin"
                  ? "bg-destructive text-destructive-foreground"
                  : "text-destructive hover:bg-destructive/10"
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-4 w-20 bg-sidebar-foreground/20 rounded animate-pulse mb-1" />
                  <div className="h-3 w-28 bg-sidebar-foreground/10 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="font-medium truncate">{displayName}</p>
                  <p className="text-sm text-sidebar-foreground/60 truncate">{displayEmail}</p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
