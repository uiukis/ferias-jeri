"use client";
import { useAuthStore } from "@/stores/auth";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import LogoFont from "../icons/LogoFont";

export default function Topbar({ initialName }: { initialName?: string }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const storeName = useAuthStore((s) => s.name);
  const name = storeName ?? initialName ?? "";
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const linkClass = (href: string) =>
    `px-3 py-2 text-sm font-medium ${
      pathname.startsWith(href)
        ? "text-amber-500"
        : "text-foreground/80 hover:text-foreground"
    }`;

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[95%] max-w-5xl -translate-x-1/2">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative z-50 flex items-center justify-between rounded-full bg-secondary px-6 py-2 shadow-lg ring-1 ring-black/5"
      >
        <div className="flex items-center gap-2">
          <LogoFont className="h-6 w-auto" />
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <motion.a
            href="/dashboard"
            className={linkClass("/dashboard")}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.25 }}
          >
            Dashboard
          </motion.a>
          {role === "admin" && (
            <motion.a
              href="/admin/reports"
              className={linkClass("/admin/reports")}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25, delay: 0.05 }}
            >
              Reports
            </motion.a>
          )}
          <motion.a
            href="/vouchers"
            className={linkClass("/vouchers")}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            Vouchers
          </motion.a>
        </nav>
        <div className="flex items-center gap-3 md:gap-3">
          <button
            className="md:hidden inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-foreground/80 hover:text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir navegação"
          >
            <span suppressHydrationWarning>{name}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <span
            className="hidden md:inline text-sm font-medium"
            suppressHydrationWarning
          >
            {name}
          </span>
          <motion.button
            aria-label="Logout"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="rounded-full p-1.5 text-foreground/70 hover:text-foreground"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-40 -mt-0.5 w-[95%] max-w-5xl -translate-x-1/2 rounded-b-xl bg-secondary/95 p-3 shadow-md ring-1 ring-black/5 md:hidden"
          >
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Dashboard
            </Link>
            {role === "admin" && (
              <Link
                href="/admin/reports"
                className={linkClass("/admin/reports")}
              >
                Reports
              </Link>
            )}
            <Link href="/vouchers" className={linkClass("/vouchers")}>
              Vouchers
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
