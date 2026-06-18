import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { createChatSocket } from "@/lib/api";

export const useGlobalSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Don't open a second connection if one already exists and is open
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const incoming = JSON.parse(event.data);

        // Only handle notification payloads here
        // Chat messages are handled by Messages.tsx's own socket
        if (incoming.type === "notification") {
          useNotificationStore.getState().addNotification({
            type: incoming.notification_type,
            title: incoming.title,
            text: incoming.text,
            link: incoming.link,
            senderId: incoming.sender_id,
            senderName: incoming.sender_name,
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    socket.onerror = () => {};

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  return socketRef;
};