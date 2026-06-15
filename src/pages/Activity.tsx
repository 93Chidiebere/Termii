import { Heart, MessageCircle, UserPlus, AtSign, Share2, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNotificationStore, type NotificationType, type AppNotification } from "@/stores/notificationStore";

const iconMap: Record<NotificationType, React.ReactNode> = {
  like: <Heart size={16} className="text-terracotta" />,
  comment: <MessageCircle size={16} className="text-primary" />,
  follow: <UserPlus size={16} className="text-gold" />,
  mention: <AtSign size={16} className="text-accent-foreground" />,
  share: <Share2 size={16} className="text-muted-foreground" />,
  message: <MessageCircle size={16} className="text-primary" />,
};

const bgMap: Record<NotificationType, string> = {
  like: "bg-terracotta/10",
  comment: "bg-primary/10",
  follow: "bg-gold/10",
  mention: "bg-accent",
  share: "bg-muted",
  message: "bg-primary/10",
};

const Activity = () => {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, unreadCount } = useNotificationStore();
  const count = unreadCount();

  const handleClick = (n: AppNotification) => {
  markRead(n.id);
  if (n.type === "message" && n.senderId) {
    // Navigate to messages and auto-open the conversation
    navigate("/messages", {
      state: {
        openConversation: {
          participant_id: n.senderId,
          participant_name: n.senderName || n.title,
          participant_email: n.senderEmail || "",
          last_message: "",
          last_timestamp: new Date().toISOString(),
          unread_count: 0,
          },
        },
      });
    } else {
    navigate(n.link);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
            {count > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{count} unread</p>
            )}
          </div>
          {count > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Bell size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              When someone messages you or interacts with your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {notifications.map((n, i) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleClick(n)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  !n.read ? "bg-primary/5" : "hover:bg-card"
                }`}
              >
                {/* Avatar or initials */}
                <div className="relative flex-shrink-0">
                  {n.avatar ? (
                    <img src={n.avatar} alt={n.title} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {n.title[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {!n.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "text-foreground" : "text-foreground/80"}`}>
                    <span className="font-semibold">{n.title}</span>{" "}
                    {n.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>

                <div className={`p-2 rounded-full shrink-0 ${bgMap[n.type]}`}>
                  {iconMap[n.type]}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Activity;