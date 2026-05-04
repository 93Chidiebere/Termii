import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SavedState {
  savedIds: string[];
  toggleSaved: (postId: string) => void;
  isSaved: (postId: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      toggleSaved: (postId) =>
        set((state) => ({
          savedIds: state.savedIds.includes(postId)
            ? state.savedIds.filter((id) => id !== postId)
            : [postId, ...state.savedIds],
        })),
      isSaved: (postId) => get().savedIds.includes(postId),
    }),
    { name: "termii-saved-posts" }
  )
);
