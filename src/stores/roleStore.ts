import { create } from "zustand";

type UserRole = "user" | "admin" | "moderator";

interface RoleState {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  hasRole: (userId: string | undefined, role: UserRole) => boolean;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  isAdmin: false,

  setIsAdmin: (value: boolean) => set({ isAdmin: value }),

  // hasRole now just checks the real isAdmin flag for the "admin" role.
  // userId param kept for backwards compatibility with existing call sites.
  hasRole: (_userId, role) => {
    if (role === "admin") return get().isAdmin;
    return false;
  },
}));