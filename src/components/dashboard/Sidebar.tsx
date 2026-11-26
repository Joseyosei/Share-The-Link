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
  ClipboardList,
  TrendingUp
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

const navGroups = [
  { label: "Workspace", items: [
    { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: "/dashboard" },
    { icon: Link2, labelKey: "sidebar.links", href: "/dashboard/links" },
    { icon: Palette, labelKey: "sidebar.appearance", href: "/dashboard/appearance" },
    { icon: QrCode, labelKey: "sidebar.qrCodes", href: "/dashboard/qr-code" },
    { icon: Globe, label: "Domains", href: "/dashboard/domains" },
  ] },
  { label: "Commerce", items: [
    { icon: Store, labelKey: "sidebar.myShop", href: "/connect" },
    { icon: CalendarCheck, labelKey: "sidebar.bookings", href: "/dashboard/bookings" },
    { icon: Heart, labelKey: "sidebar.tipJar", href: "/dashboard/tip-jar" },
  ] },
  { label: "Audience & analytics", items: [
    { icon: BarChart3, labelKey: "sidebar.analytics", href: "/analytics" },
    { icon: ClipboardList, labelKey: "sidebar.forms", href: "/dashboard/forms" },
    { icon: Mail, label: "Subscribers", href: "/dashboard/subscribers" },
    { icon: MessageSquareQuote, label: "Reviews", href: "/dashboard/reviews" },
    { icon: FlaskConical, labelKey: "sidebar.abTesting", href: "/dashboard/ab-testing" },
  ] },
  { label: "Content & AI", items: [
    { icon: Radio, labelKey: "sidebar.liveStreaming", href: "/streaming" },
    { icon: TrendingUp, label: "Discover", href: "/discover" },
    { icon: Play, labelKey: "sidebar.media", href: "/dashboard/media" },
    { icon: Bot, label: "STL Bot", href: "/dashboard/stl-bot" },
    { icon: Wand2, labelKey: "sidebar.aiBuilder", href: "/ai-builder" },
    { icon: MessageSquareQuote, label: "Auto-Reply", href: "/dashboard/auto-reply" },
  ] },
  { label: "Settings & support", items: [
    { icon: Zap, labelKey: "sidebar.integrations", href: "/dashboard/integrations" },
    { icon: Webhook, label: "Webhooks", href: "/dashboard/webhooks" },
    { icon: Users, labelKey: "sidebar.teamMembers", href: "/dashboard/team" },
    { icon: Settings, labelKey: "sidebar.settings", href: "/dashboard/settings" },
    { icon: HeadphonesIcon, label: "Support", href: "/dashboard/support" },
    { icon: HelpCircle, labelKey: "sidebar.helpCenter", href: "/help" },
  ] },
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
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 liquid-glass-sidebar text-sidebar-foreground flex-col z-40">

      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/">
          <Logo textClassName="text-sidebar-foreground" />
        </Link>
      </div>

      {/* Navigation - scrollable */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        {navGroups.map(group => (
          <section key={group.label} className="mb-4">
            <h2 className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">{group.label}</h2>
            {group.items.map((item) => {
          const isActive = location.pathname === item.href;
          const IconComponent = item.icon;
          const displayLabel = item.labelKey ? t(item.labelKey) : item.label;
          return (
            <Link
              key={item.href}
              to={item.href}
                aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-white/10 backdrop-blur-lg text-white border border-white/10 shadow-lg shadow-primary/10"
                  : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-medium">{displayLabel}</span>
            </Link>
          );
        })}
          </section>
        ))}

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
