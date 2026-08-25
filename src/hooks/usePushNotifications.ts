import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import {apiClient} from "@/lib/api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        const currentUserId = user?.id || "guest";
        const lastSyncedUser = localStorage.getItem("push-synced-user");

        // If already subscribed and synced for current user session/state, skip API call
        if (subscription && lastSyncedUser === currentUserId) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const sub = subscription.toJSON();
        await apiClient.post("/push/subscribe", {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          },
        });

        localStorage.setItem("push-synced-user", currentUserId);
      } catch {
        // Permission denied or subscription failed — silently ignore
      }
    };

    // Slight delay so the user is settled in the app before the permission prompt
    const timer = setTimeout(subscribe, 5000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.id]);
};