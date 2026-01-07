import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

type Row = {
  id: string;
  voucher_code: string | null;
  client_name: string | null;
  tour_id: string | null;
  partial_amount: number | null;
  embark_amount: number | null;
  status: string | null;
  embark_date: string;
  seller_id: string | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function useAdminVouchersQuery(date: Date | undefined, staleTime = 1000 * 30) {
  const d = date ?? new Date();
  const from = startOfDay(d).toISOString();
  const to = endOfDay(d).toISOString();
  return useQuery<Row[], Error>({
    queryKey: ["vouchers", "admin", { from, to }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/vouchers?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
        method: "GET",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = String(json.error ?? `HTTP ${res.status}`);
        if (msg.includes("Service role não configurado")) {
          const { data, error } = await supabase
            .from("vouchers")
            .select(
              "id,voucher_code,client_name,tour_id,partial_amount,embark_amount,status,embark_date,seller_id"
            )
            .gte("embark_date", from)
            .lte("embark_date", to)
            .order("embark_date", { ascending: true });
          if (error) throw new Error(error.message);
          return (data ?? []) as Row[];
        }
        throw new Error(msg);
      }
      return (json.items ?? []) as Row[];
    },
    staleTime,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}
