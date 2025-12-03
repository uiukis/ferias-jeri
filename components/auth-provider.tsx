"use client";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const pathname = usePathname();
  const initialX = pathname.startsWith("/vouchers") ? 24 : -24;

  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|; )auth_name=([^;]+)/);
      const cachedName = m ? decodeURIComponent(m[1]) : null;
      if (cachedName) {
        useAuthStore.setState({ name: cachedName });
      }
    } catch {}
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const u = sessionData.session?.user ?? null;
      setUser(u);
      if (u) {
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
        const lowered =
          typeof rawRole === "string" ? rawRole.toLowerCase() : null;
        const prof = await loadProfile(u.id);
        const r = (lowered ?? prof.role) as "admin" | "seller" | null;
        const normalizedRole = r === "admin" || r === "seller" ? r : null;
        const cookieName = (() => {
          try {
            const m = document.cookie.match(/(?:^|; )auth_name=([^;]+)/);
            return m ? decodeURIComponent(m[1]) : null;
          } catch {
            return null;
          }
        })();
        useAuthStore.setState({
          role: normalizedRole,
          name: cookieName ?? (userMeta?.name as string | null) ?? prof.name,
          email: u.email ?? null,
        });
        document.cookie = `auth_uid=${u.id}; path=/`;
        document.cookie = `auth_role=${normalizedRole ?? ""}; path=/`;
        const finalName =
          cookieName ?? (userMeta?.name as string | null) ?? prof.name;
        if (finalName) {
          document.cookie = `auth_name=${encodeURIComponent(
            finalName
          )}; path=/`;
        }
      }
      setInitialized(true);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
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
          const lowered =
            typeof rawRole === "string" ? rawRole.toLowerCase() : null;
          const prof = await loadProfile(u.id);
          const r = (lowered ?? prof.role) as "admin" | "seller" | null;
          const normalizedRole = r === "admin" || r === "seller" ? r : null;
          const cookieName = (() => {
            try {
              const m = document.cookie.match(/(?:^|; )auth_name=([^;]+)/);
              return m ? decodeURIComponent(m[1]) : null;
            } catch {
              return null;
            }
          })();
          useAuthStore.setState({
            role: normalizedRole,
            name: cookieName ?? (userMeta?.name as string | null) ?? prof.name,
            email: u.email ?? null,
          });
          document.cookie = `auth_uid=${u.id}; path=/`;
          document.cookie = `auth_role=${normalizedRole ?? ""}; path=/`;
          const finalName =
            cookieName ?? (userMeta?.name as string | null) ?? prof.name;
          if (finalName) {
            document.cookie = `auth_name=${encodeURIComponent(
              finalName
            )}; path=/`;
          }
        } else {
          document.cookie = `auth_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          document.cookie = `auth_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
        setInitialized(true);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser, loadProfile, setInitialized]);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: initialX }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </QueryClientProvider>
  );
}
