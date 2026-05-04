import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, PlusSquare, Bell, User, MessageCircle, Shield, Users, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useRoleStore } from "@/stores/roleStore";

const navItems = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Search, label: "Explore" },
  { to: "/create", icon: PlusSquare, label: "Create" },
  { to: "/activity", icon: Bell, label: "Notifications" },
  { to: "/messages", icon: MessageCircle, label: "Messages" },
  { to: "/hair-twins", icon: Users, label: "Hair Twins" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const DesktopSidebar = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole } = useRoleStore();
  const isAdmin = isAuthenticated && user && hasRole(user.id, "admin");

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-warm-brown flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-2xl font-bold text-sidebar-foreground">Termii</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 tracking-wider uppercase">Your Hair is Your Pride</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="font-medium">{label}</span>
            </NavLink>
          );
        })}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              location.pathname === "/admin"
                ? "bg-sidebar-accent text-gold"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Shield size={22} strokeWidth={location.pathname === "/admin" ? 2.5 : 1.5} />
            <span className="font-medium">Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/login"
          className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-gold text-gold-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Sign In
        </NavLink>
      </div>
    </aside>
  );
};
