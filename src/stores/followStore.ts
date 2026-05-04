import { create } from "zustand";

interface FollowState {
  followedUsers: Set<string>;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followedUsers: new Set<string>(),
  isFollowing: (userId: string) => get().followedUsers.has(userId),
  toggleFollow: (userId: string) =>
    set((state) => {
      const next = new Set(state.followedUsers);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return { followedUsers: next };
    }),
}));
