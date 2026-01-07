import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function guardAuth(req: NextRequest) {
  const uid = req.cookies.get("auth_uid")?.value ?? "";
  if (!uid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return null;
}

export function guardAdmin(req: NextRequest) {
  const authRedirect = guardAuth(req);
  if (authRedirect) return authRedirect;
  const role = req.cookies.get("auth_role")?.value ?? "";
  if (role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return null;
}

export function guardFirstAccessChange(req: NextRequest) {
  const mcp = req.cookies.get("auth_mcp")?.value ?? "";
  if (mcp === "1") {
    const url = req.nextUrl.clone();
    url.pathname = "/first-access";
    return NextResponse.redirect(url);
  }
  return null;
}

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const protectedPaths = ["/dashboard", "/vouchers", "/admin", "/users", "/ordens"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const authRedirect = guardAuth(req);
    if (authRedirect) return authRedirect;
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/users") || pathname.startsWith("/ordens")) {
    const adminRedirect = guardAdmin(req);
    if (adminRedirect) return adminRedirect;
  }
  if (isProtected && !pathname.startsWith("/first-access")) {
    const mcpRedirect = guardFirstAccessChange(req);
    if (mcpRedirect) return mcpRedirect;
  }
  return NextResponse.next();
}
