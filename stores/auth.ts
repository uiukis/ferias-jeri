import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

type Role = "admin" | "seller" | null;

interface AuthState {
  user: User | null;
  role: Role;
  name?: string | null;
  email?: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setInitialized: (initialized: boolean) => void;
  loadProfile: (uid: string) => Promise<{ name: string | null; role: Role }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  name: null,
  email: null,
  loading: false,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      const u = data.user!;
      const { data: sessionData } = await supabase.auth.getSession();
      const appMeta = sessionData.session?.user?.app_metadata as
        | Record<string, unknown>
        | undefined;
      const userMeta = sessionData.session?.user?.user_metadata as
        | Record<string, unknown>
        | undefined;
      const rawRole =
        (appMeta?.role as string | undefined) ||
        (userMeta?.role as string | undefined) ||
        null;
      const lowered = typeof rawRole === "string" ? rawRole.toLowerCase() : null;
      const roleFromJwt =
        lowered === "admin" || lowered === "seller" ? (lowered as Role) : null;
      const prof = await get().loadProfile(u.id);
      const resolvedRole: Role = roleFromJwt ?? prof.role;
      set({
        user: u,
        role: resolvedRole,
        name: prof.name,
        email: u.email ?? null,
        initialized: true,
      });
      document.cookie = `auth_uid=${u.id}; path=/`;
      document.cookie = `auth_role=${resolvedRole ?? ""}; path=/`;
      if (prof.name) {
        document.cookie = `auth_name=${encodeURIComponent(prof.name)}; path=/`;
      }
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, role: null, initialized: true });
      document.cookie = `auth_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `auth_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } finally {
      set({ loading: false });
    }
  },
  loadProfile: async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("name,role")
      .eq("id", uid)
      .single();
    if (error) return { name: null, role: null };
    const r = data?.role as string | null | undefined;
    const lowered = typeof r === "string" ? r.toLowerCase() : null;
    const normalized: Role =
      lowered === "admin" || lowered === "seller" ? lowered : null;
    return {
      name: (data?.name as string | null) ?? null,
      role: normalized,
    };
  },
}));
