import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { createChatSocket } from "@/lib/api";

export const useGlobalSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      const socket = createChatSocket(token);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0; // reset backoff on successful connect
      };

      socket.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);
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

      socket.onerror = () => {
        // onclose will fire next and handle reconnect
      };

      socket.onclose = () => {
        if (isUnmounted) return;
        // Exponential backoff: 1s, 2s, 4s, 8s, capped at 30s
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  return socketRef;
};