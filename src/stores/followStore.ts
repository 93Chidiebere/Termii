import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "@/lib/api";

interface FollowState {
  followedIds: string[];
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  loadMyFollowing: () => Promise<void>;
  getFollowersCount: (userId: string) => number;
  followerCounts: Record<string, number>;
  setFollowerCount: (userId: string, count: number) => void;
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      followedIds: [],
      followerCounts: {},

      isFollowing: (userId: string) => get().followedIds.includes(userId),

      toggleFollow: async (userId: string) => {
        // Optimistic update
        const wasFollowing = get().followedIds.includes(userId);
        set((state) => ({
          followedIds: wasFollowing
            ? state.followedIds.filter((id) => id !== userId)
            : [...state.followedIds, userId],
        }));

        try {
          const response = await apiClient.post(`/follows/${userId}`);
          const { following, followers_count } = response.data;
          // Sync with server truth
          set((state) => ({
            followedIds: following
              ? [...state.followedIds.filter((id) => id !== userId), userId]
              : state.followedIds.filter((id) => id !== userId),
            followerCounts: {
              ...state.followerCounts,
              [userId]: followers_count,
            },
          }));
        } catch {
          // Revert on failure
          set((state) => ({
            followedIds: wasFollowing
              ? [...state.followedIds, userId]
              : state.followedIds.filter((id) => id !== userId),
          }));
        }
      },

      loadMyFollowing: async () => {
        try {
          const response = await apiClient.get("/follows/my/following");
          set({ followedIds: response.data.following_ids || [] });
        } catch {
          // keep existing state
        }
      },

      getFollowersCount: (userId: string) => get().followerCounts[userId] ?? 0,

      setFollowerCount: (userId: string, count: number) =>
        set((state) => ({
          followerCounts: { ...state.followerCounts, [userId]: count },
        })),
    }),
    {
      name: "termii-follows",
      // Persist followedIds and followerCounts only
      partialize: (state) => ({
        followedIds: state.followedIds,
        followerCounts: state.followerCounts,
      }),
    }
  )
);