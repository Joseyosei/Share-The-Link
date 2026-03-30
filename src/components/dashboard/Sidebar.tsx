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
  Zap,
  Shield,
  QrCode,
  CalendarCheck,
  MessageSquareQuote,
  Bot,
  HeadphonesIcon,
  Mail,
  Heart,
  Webhook,
  Users,
  Globe,
  FlaskConical,
  ClipboardList
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  // Core
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: "/dashboard" },
  { icon: Link2, labelKey: "sidebar.links", href: "/dashboard/links" },
  { icon: Palette, labelKey: "sidebar.appearance", href: "/dashboard/appearance" },
  { icon: BarChart3, labelKey: "sidebar.analytics", href: "/analytics" },
  // Content & Commerce
  { icon: ClipboardList, labelKey: "sidebar.forms", href: "/dashboard/forms", isNew: true },
  { icon: Store, labelKey: "sidebar.myShop", href: "/connect", isNew: true },
  { icon: CalendarCheck, labelKey: "sidebar.bookings", href: "/dashboard/bookings", isNew: true },
  { icon: Heart, labelKey: "sidebar.tipJar", href: "/dashboard/tip-jar", isNew: true },
  // Media & Live
  { icon: Radio, labelKey: "sidebar.liveStreaming", href: "/streaming", isNew: true },
  { icon: Play, labelKey: "sidebar.media", href: "/dashboard/media", isNew: true },
  { icon: QrCode, labelKey: "sidebar.qrCodes", href: "/dashboard/qr-code", isNew: true },
  // AI & Automation
  { icon: Bot, label: "STL Bot", href: "/dashboard/stl-bot", isNew: true },
  { icon: Wand2, labelKey: "sidebar.aiBuilder", href: "/ai-builder", isNew: true },
  { icon: MessageSquareQuote, label: "Auto-Reply", href: "/dashboard/auto-reply", isNew: true },
  // Audience & Growth
  { icon: Mail, label: "Subscribers", href: "/dashboard/subscribers", isNew: true },
  { icon: MessageSquareQuote, label: "Reviews", href: "/dashboard/reviews", isNew: true },
  { icon: FlaskConical, labelKey: "sidebar.abTesting", href: "/dashboard/ab-testing", isNew: true },
  // Tools & Config
  { icon: Zap, labelKey: "sidebar.integrations", href: "/dashboard/integrations", isNew: true },
  { icon: Webhook, label: "Webhooks", href: "/dashboard/webhooks", isNew: true },
  { icon: Globe, label: "Domains", href: "/dashboard/domains", isNew: true },
  { icon: Users, labelKey: "sidebar.teamMembers", href: "/dashboard/team", isNew: true },
  // Support & Settings
  { icon: HeadphonesIcon, label: "Support", href: "/dashboard/support", isNew: true },
  { icon: Settings, labelKey: "sidebar.settings", href: "/dashboard/settings" },
  { icon: HelpCircle, labelKey: "sidebar.helpCenter", href: "/help" },
];

const ADMIN_EMAILS = ["admin@sharethelink.io"];

export const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading } = useUserProfile();
  const { subscription } = useSubscription();
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
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const displayName = profile?.full_name || profile?.username || "User";
  const displayEmail = profile?.email || "user@example.com";

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
          const displayLabel = item.labelKey ? t(item.labelKey) : item.label;
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
              <span className="font-medium">{displayLabel}</span>
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
            to="/dashboard/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mt-2 border border-destructive/20 ${
              location.pathname === "/dashboard/admin"
                ? "bg-destructive text-destructive-foreground"
                : "text-destructive hover:bg-destructive/10"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">{t("sidebar.admin")}</span>
          </Link>
        )}
      </nav>

      {/* Language Selector & User Profile */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        <LanguageSelector variant="sidebar" />
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent mb-1.5 mt-1.5">
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
          <span className="font-medium">{t("sidebar.logOut")}</span>
        </button>
      </div>
    </aside>
  );
};
