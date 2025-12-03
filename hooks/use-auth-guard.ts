"use client";
import { useAuthStore } from "@/stores/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type Options = {
  requireAuth?: boolean;
  requiredRole?: "admin" | "seller";
  redirectTo?: string;
};

export function useAuthGuard(options: Options = {}) {
  const { requireAuth = false, requiredRole, redirectTo = "/login" } = options;
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  console.log("useAuthGuard", requireAuth, requiredRole, redirectTo, user, role, initialized, loading);

  useEffect(() => {
    if (!initialized) return;
    if (requireAuth && !user) {
      router.replace(redirectTo);
      return;
    }
    if (requiredRole && role !== requiredRole) {
      router.replace(redirectTo);
    }
  }, [
    requireAuth,
    requiredRole,
    redirectTo,
    user,
    role,
    initialized,
    router,
    pathname,
  ]);

  return { user, role, loading };
}
