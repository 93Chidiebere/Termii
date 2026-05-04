import { create } from "zustand";

type UserRole = "user" | "admin" | "moderator";

interface RoleState {
  roles: Record<string, UserRole[]>;
  hasRole: (userId: string, role: UserRole) => boolean;
  addRole: (userId: string, role: UserRole) => void;
  removeRole: (userId: string, role: UserRole) => void;
}

// Mock: user "1" (Uju) is admin
export const useRoleStore = create<RoleState>((set, get) => ({
  roles: {
    "1": ["admin", "user"],
    "2": ["user"],
  },
  hasRole: (userId, role) => get().roles[userId]?.includes(role) ?? false,
  addRole: (userId, role) =>
    set((state) => {
      const current = state.roles[userId] || [];
      if (current.includes(role)) return state;
      return { roles: { ...state.roles, [userId]: [...current, role] } };
    }),
  removeRole: (userId, role) =>
    set((state) => {
      const current = state.roles[userId] || [];
      return { roles: { ...state.roles, [userId]: current.filter((r) => r !== role) } };
    }),
}));
