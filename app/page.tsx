import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const store = await cookies();
  const uid = store.get("auth_uid")?.value;
  if (!uid) {
    redirect("/login");
  }
  const must = store.get("auth_mcp")?.value === "1";
  if (must) {
    redirect("/first-access");
  }
  const role = store.get("auth_role")?.value ?? "";
  if (role === "admin") {
    redirect("/ordens");
  }
  redirect("/dashboard");
}
