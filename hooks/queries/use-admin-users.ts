import { useQuery } from "@tanstack/react-query";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
};

export function useAdminUsersQuery(staleTime = 1000 * 30) {
  return useQuery<Profile[], Error>({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json.error ?? `HTTP ${res.status}`));
      const items = (json.items ?? []) as Profile[];
      return items;
    },
    staleTime,
  });
}

