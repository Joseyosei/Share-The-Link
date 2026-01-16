import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Link2, 
  Palette, 
  BarChart3, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/dashboard/links" },
  { icon: Palette, label: "Appearance", href: "/dashboard/appearance" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading } = useUserProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const displayEmail = profile?.email || "user@example.com";

  // Hide on mobile - MobileSidebar handles mobile view
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-button flex items-center justify-center">
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
  );
};
