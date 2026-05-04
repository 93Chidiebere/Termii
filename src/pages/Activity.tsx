import { useState } from "react";
import { Heart, MessageCircle, UserPlus, AtSign, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { users } from "@/data/mockData";

type NotificationType = "like" | "comment" | "follow" | "mention" | "share";

interface Notification {
  id: string;
  type: NotificationType;
  user: typeof users[0];
  text: string;
  time: string;
  read: boolean;
  link: string;
}

const notifications: Notification[] = [
  { id: "n1", type: "like", user: users[1], text: "liked your twist-out post", time: "2m ago", read: false, link: "/post/1" },
  { id: "n2", type: "comment", user: users[1], text: 'commented: "Love this style! 😍"', time: "15m ago", read: false, link: "/post/1" },
  { id: "n3", type: "follow", user: users[1], text: "started following you", time: "1h ago", read: false, link: "/profile" },
  { id: "n4", type: "mention", user: users[1], text: "mentioned you in a comment", time: "2h ago", read: true, link: "/post/2" },
  { id: "n5", type: "share", user: users[1], text: "shared your low bun post", time: "3h ago", read: true, link: "/post/3" },
  { id: "n6", type: "like", user: users[1], text: "liked your bun with fringe post", time: "5h ago", read: true, link: "/post/4" },
  { id: "n7", type: "comment", user: users[1], text: 'commented: "What products did you use?"', time: "6h ago", read: true, link: "/post/3" },
  { id: "n8", type: "follow", user: users[0], text: "started following you", time: "1d ago", read: true, link: "/profile" },
  { id: "n9", type: "share", user: users[1], text: "shared your wash day post", time: "1d ago", read: true, link: "/post/6" },
  { id: "n10", type: "mention", user: users[0], text: "mentioned you in a post", time: "2d ago", read: true, link: "/post/8" },
];

const iconMap: Record<NotificationType, React.ReactNode> = {
  like: <Heart size={16} className="text-terracotta" />,
  comment: <MessageCircle size={16} className="text-primary" />,
  follow: <UserPlus size={16} className="text-gold" />,
  mention: <AtSign size={16} className="text-accent-foreground" />,
  share: <Share2 size={16} className="text-muted-foreground" />,
};

const bgMap: Record<NotificationType, string> = {
  like: "bg-terracotta/10",
  comment: "bg-primary/10",
  follow: "bg-gold/10",
  mention: "bg-accent",
  share: "bg-muted",
};

type FilterTab = "all" | NotificationType;

const tabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "like", label: "Likes" },
  { value: "comment", label: "Comments" },
  { value: "follow", label: "Follows" },
  { value: "mention", label: "Mentions" },
  { value: "share", label: "Shares" },
];

const Activity = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.read).map((n) => n.id))
  );

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const handleClick = (notif: Notification) => {
    setReadIds((prev) => new Set(prev).add(notif.id));
    navigate(notif.link);
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-0.5">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No notifications yet</p>
          )}
          {filtered.map((n, i) => {
            const isUnread = !readIds.has(n.id);
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleClick(n)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  isUnread ? "bg-primary/5" : "hover:bg-card"
                }`}
              >
                <div className="relative">
                  <img
                    src={n.user.avatar}
                    alt={n.user.displayName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isUnread ? "text-foreground" : "text-foreground/80"}`}>
                    <span className="font-semibold">{n.user.displayName}</span>{" "}
                    {n.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
                <div className={`p-2 rounded-full shrink-0 ${bgMap[n.type]}`}>
                  {iconMap[n.type]}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Activity;
