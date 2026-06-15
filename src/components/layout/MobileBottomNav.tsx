import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, PlusSquare, MessageCircle, Users, Bell, User } from "lucide-react";
import { useNotificationStore } from "@/stores/notificationStore";

const navItems = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Search, label: "Explore" },
  { to: "/marketplace", icon: ShoppingBag, label: "Shop" },
  { to: "/create", icon: PlusSquare, label: "Create" },
  { to: "/hair-twins", icon: Users, label: "Twins" },
  { to: "/messages", icon: MessageCircle, label: "Chat" },
  { to: "/activity", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const notifCount = useNotificationStore((state) => state.unreadCount());

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-1 overflow-x-auto scrollbar-hide">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isNotif = to === "/activity";
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors min-w-0 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {isNotif && notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};