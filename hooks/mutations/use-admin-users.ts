import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreatePayload = {
  name?: string;
  email: string;
  password: string;
  role?: string;
};

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation<{ id: string | undefined }, Error, CreatePayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json.error ?? `HTTP ${res.status}`));
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      return json as { id: string | undefined };
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String(json.error ?? `HTTP ${res.status}`));
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      return json as { ok: true };
    },
  });
}

