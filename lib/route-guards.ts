import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("auth_uid")?.value ?? "";
  if (!uid) redirect("/login");
}

export async function requireAdmin() {
  await requireAuth();
  const cookieStore = await cookies();
  const role = cookieStore.get("auth_role")?.value ?? "";
  if (role !== "admin") redirect("/dashboard");
}

export async function requireFirstAccessChange() {
  const cookieStore = await cookies();
  const mcp = cookieStore.get("auth_mcp")?.value ?? "";
  if (mcp === "1") redirect("/first-access");
}

