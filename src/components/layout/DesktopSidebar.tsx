import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusSquare, Bell, User, MessageCircle, Shield, Users, ShoppingBag, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useRoleStore } from "@/stores/roleStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useMessageStore } from "@/stores/messageStore";

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
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { hasRole } = useRoleStore();
  const notifCount = useNotificationStore((state) => state.unreadCount());
  const msgCount = useMessageStore((state) => state.unreadCount);

  const isAdmin = isAuthenticated && user && hasRole(user.id, "admin");
  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "Profile";
  const userEmail = user?.email || "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-warm-brown flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="font-display text-2xl font-bold text-sidebar-foreground">Ngala Africa</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1 tracking-wider uppercase">Your Hair is Your Pride</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isNotif = to === "/activity";
          const isMsg = to === "/messages";
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
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {isNotif && notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
                {isMsg && msgCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {msgCount > 9 ? "9+" : msgCount}
                  </span>
                )}
              </div>
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
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {displayName[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors flex-shrink-0"
            >
              <LogOut size={18} className="text-sidebar-foreground/60" />
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-gold text-gold-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Sign In
          </NavLink>
        )}
      </div>
    </aside>
  );
};