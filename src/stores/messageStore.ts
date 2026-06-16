import { create } from "zustand";

interface MessageState {
  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  unreadCount: 0,
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}));