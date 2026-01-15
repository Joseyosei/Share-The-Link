import { Link, useLocation } from "react-router-dom";
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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/dashboard/links" },
  { icon: Palette, label: "Appearance", href: "/dashboard/appearance" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

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
              <item.icon className="w-5 h-5" />
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
            <p className="font-medium truncate">John Doe</p>
            <p className="text-sm text-sidebar-foreground/60 truncate">john@example.com</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log out</span>
        </Link>
      </div>
    </aside>
  );
};
