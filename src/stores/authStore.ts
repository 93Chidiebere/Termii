import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginUser, registerUser, getMe } from "@/lib/api";
import { useRoleStore } from "@/stores/roleStore";
import type { User } from "@/data/mockData";

interface SignupData {
  email: string;
  password: string;
  displayName: string;
  username: string;
  hairType: string;
  interests: string[];
  country: string;
  province: string;
  isMinor: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isMinor: boolean;
  token: string | null;
  signupStep: number;
  signupData: Partial<SignupData>;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;
  setSignupStep: (step: number) => void;
  updateSignupData: (data: Partial<SignupData>) => void;
  resetSignup: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isMinor: false,
      token: null,
      signupStep: 0,
      signupData: {},
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Step 1 — get the JWT token
          const data = await loginUser(email, password);
          localStorage.setItem("termii-token", data.access_token);

          // Step 2 — use the token to fetch the real user profile
          const profile = await getMe();

          // Step 3 — build a User object from the real profile data
          const userObj = {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            displayName: profile.full_name,
            username: profile.username || profile.email.split("@")[0],
            avatar: profile.avatar_url || "",
            hairType: profile.hair_type || "",
            bio: "",
            followers: 0,
            following: 0,
            posts: 0,
          } as unknown as User;

          set({
            user: userObj,
            isAuthenticated: true,
            token: data.access_token,
            isLoading: false,
            error: null,
          });

          // Sync admin status from the real backend field
          useRoleStore.getState().setIsAdmin(profile.is_admin ?? false);

        } catch (err: unknown) {
          let message = "Login failed. Please check your email and password.";
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          ) {
            message = String(
              (err as { response: { data: { detail: string } } }).response.data
                .detail
            );
          }
          set({ isLoading: false, error: message, isAuthenticated: false });
        }
      },

      signup: async () => {
        const { signupData } = get();
        set({ isLoading: true, error: null });
        try {
          await registerUser({
            full_name: signupData.displayName || "",
            email: signupData.email || "",
            password: signupData.password || "",
            username: signupData.username || undefined,
            hair_type: signupData.hairType,
          });
          // After registering, log in automatically — this also calls getMe()
          await get().login(signupData.email || "", signupData.password || "");
          set({
            isMinor: signupData.isMinor ?? false,
            signupStep: 0,
            signupData: {},
            isLoading: false,
          });
        } catch (err: unknown) {
          let message = "Signup failed. Please try again.";
          if (
            err &&
            typeof err === "object" &&
            "response" in err &&
            (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          ) {
            message = String(
              (err as { response: { data: { detail: string } } }).response.data
                .detail
            );
          }
          set({ isLoading: false, error: message });
        }
      },

      logout: () => {
        localStorage.removeItem("termii-token");
        set({
          user: null,
          isAuthenticated: false,
          isMinor: false,
          token: null,
          error: null,
          isLoading: false,
        });
      },

      setSignupStep: (step) => set({ signupStep: step }),

      updateSignupData: (data) =>
        set((state) => ({ signupData: { ...state.signupData, ...data } })),

      resetSignup: () => set({ signupStep: 0, signupData: {} }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "termii-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isMinor: state.isMinor,
        token: state.token,
      }),
    }
  )
);