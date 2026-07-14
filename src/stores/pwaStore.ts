import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PwaState {
  deferredPrompt: any | null;
  dismissed: boolean;
  installed: boolean;
  setDeferredPrompt: (prompt: any) => void;
  clearDeferredPrompt: () => void;
  setDismissed: () => void;
  setInstalled: () => void;
}

export const usePwaStore = create<PwaState>()(
  persist(
    (set) => ({
      deferredPrompt: null,
      dismissed: false,
      installed: false,

      setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
      clearDeferredPrompt: () => set({ deferredPrompt: null }),
      setDismissed: () => set({ dismissed: true }),
      setInstalled: () => set({ installed: true, deferredPrompt: null }),
    }),
    {
      name: "isi-ngala-pwa",
      // Only persist dismissed and installed — not the prompt itself
      // (prompt is a live browser object, can't be serialized)
      partialize: (state) => ({
        dismissed: state.dismissed,
        installed: state.installed,
      }),
    }
  )
);