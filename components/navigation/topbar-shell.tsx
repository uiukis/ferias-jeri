"use client";
import { usePathname } from "next/navigation";
import Topbar from "./topbar";
import TopbarSpacer from "./topbar-spacer";

export default function TopbarShell({ initialName }: { initialName?: string }) {
  const pathname = usePathname();
  const hide = pathname === "/login";
  if (hide) return null;
  return (
    <>
      <Topbar initialName={initialName} />
      <TopbarSpacer />
    </>
  );
}
