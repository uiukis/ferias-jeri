"use client";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/auth";
import { useEffect } from "react";

export function useSupabaseAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  type Role = "admin" | "seller" | null;

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const prof = await loadProfile(u.id);
          const appMeta = session?.user?.app_metadata as
            | Record<string, unknown>
            | undefined;
          const userMeta = session?.user?.user_metadata as
            | Record<string, unknown>
            | undefined;
          const rawRole =
            (appMeta?.role as string | undefined) ||
            (userMeta?.role as string | undefined) ||
            null;
          const r = rawRole ?? prof.role;
          const normalizedRole: Role =
            r === "admin" || r === "seller" ? r : null;
          useAuthStore.setState({
            role: normalizedRole,
            name: prof.name,
            email: u.email ?? null,
          });
          document.cookie = `auth_uid=${u.id}; path=/`;
          document.cookie = `auth_role=${normalizedRole ?? ""}; path=/`;
        } else {
          document.cookie = `auth_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, loadProfile]);

  return { user, role };
}
