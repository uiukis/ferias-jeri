import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const store = await cookies();
  const uid = store.get("auth_uid")?.value;
  if (!uid) {
    redirect("/login");
  }

  redirect("/dashboard");
}
