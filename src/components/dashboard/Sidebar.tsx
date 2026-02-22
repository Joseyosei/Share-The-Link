import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Link2, 
  Palette, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  Radio,
  Wand2,
  Store,
  Play,
  HelpCircle,
  Zap
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/dashboard/links" },
  { icon: Radio, label: "Live Streaming", href: "/streaming", isNew: true },
  { icon: Play, label: "Media", href: "/dashboard/media", isNew: true },
  { icon: Wand2, label: "AI Builder", href: "/ai-builder", isNew: true },
  { icon: Store, label: "My Shop", href: "/connect", isNew: true },
  { icon: Palette, label: "Appearance", href: "/dashboard/appearance" },
  { icon: Zap, label: "Integrations", href: "/dashboard/integrations", isNew: true },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading } = useUserProfile();
  const { subscription } = useSubscription();

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

      {/* Navigation - scrollable */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
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
              {item.isNew && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile - always visible at bottom */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent mb-1.5">
          <div className="w-10 h-10 rounded-full bg-gradient-button flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <div className="h-4 w-20 bg-sidebar-foreground/20 rounded animate-pulse mb-1" />
                <div className="h-3 w-28 bg-sidebar-foreground/10 rounded animate-pulse" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium truncate">{displayName}</p>
                  {subscription?.subscribed && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0 border-0">
                      {subscription.tier?.toUpperCase() || "PRO"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-sidebar-foreground/60 truncate">{displayEmail}</p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
};
