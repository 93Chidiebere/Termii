import { create } from "zustand";

interface BlockMuteState {
  blockedUsers: Set<string>;
  mutedUsers: Set<string>;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
  isMuted: (userId: string) => boolean;
}

export const useBlockMuteStore = create<BlockMuteState>((set, get) => ({
  blockedUsers: new Set<string>(),
  mutedUsers: new Set<string>(),
  blockUser: (userId) =>
    set((state) => {
      const next = new Set(state.blockedUsers);
      next.add(userId);
      return { blockedUsers: next };
    }),
  unblockUser: (userId) =>
    set((state) => {
      const next = new Set(state.blockedUsers);
      next.delete(userId);
      return { blockedUsers: next };
    }),
  muteUser: (userId) =>
    set((state) => {
      const next = new Set(state.mutedUsers);
      next.add(userId);
      return { mutedUsers: next };
    }),
  unmuteUser: (userId) =>
    set((state) => {
      const next = new Set(state.mutedUsers);
      next.delete(userId);
      return { mutedUsers: next };
    }),
  isBlocked: (userId) => get().blockedUsers.has(userId),
  isMuted: (userId) => get().mutedUsers.has(userId),
}));
