import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "like" | "comment" | "follow" | "mention" | "share";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  text: string;
  time: string;
  read: boolean;
  link: string;
  avatar?: string;
  senderId?: string;
  senderName?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (n) => {
        const notification: AppNotification = {
          ...n,
          id: `notif-${Date.now()}-${Math.random()}`,
          time: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "termii-notifications" }
  )
);