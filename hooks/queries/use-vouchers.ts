import { autoExpireVouchers, listVouchersForSeller, listVouchersForSellerPaged, resetCancelledToActiveForSeller, type VoucherStatusFilter } from "@/lib/supabase/vouchers";
import type { Voucher } from "@/stores/vouchers";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

type Options = {
  staleTime?: number;
  limit?: number;
};

export function useSellerVouchersQuery(options: Options = {}) {
  const { staleTime = 1000 * 30, limit = 50 } = options;
  return useQuery({
    queryKey: ["vouchers", "seller", { limit }],
    queryFn: async () => {
      const data = (await listVouchersForSeller()) as Voucher[];
      return data.slice(0, limit);
    },
    staleTime,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}

export function useSellerVouchersPagedQuery(params: {
  page: number;
  pageSize: number;
  status: VoucherStatusFilter;
  date?: Date | undefined;
  staleTime?: number;
}): UseQueryResult<{ items: Voucher[]; total: number }, Error> {
  const { page, pageSize, status, date, staleTime = 1000 * 30 } = params;
  return useQuery<{ items: Voucher[]; total: number }, Error>({
    queryKey: ["vouchers", "seller", { page, pageSize, status, date: date?.toISOString() }],
    queryFn: async () => {
      try {
        await resetCancelledToActiveForSeller();
      } catch {}
      const res = await listVouchersForSellerPaged({
        page,
        pageSize,
        status,
        date: date ? date.toISOString() : null,
      });
      try {
        await autoExpireVouchers(res.items);
      } catch {}
      return res;
    },
    staleTime,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? { items: [], total: 0 },
  });
}
