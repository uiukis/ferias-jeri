import { supabase } from "@/lib/supabaseClient";
import { create } from "zustand";

export type Voucher = {
  id: string;
  voucher_code?: string | null;
  tour_name: string;
  seller_id: string;
  created_at: string;
  embark_date: string | null;
  partial_amount: number | null;
  embark_amount: number | null;
  status: string | null;
  deleted: boolean | null;
};

interface VouchersState {
  items: Voucher[];
  loading: boolean;
  error: string | null;
  fetchRecent: (limit?: number) => Promise<void>;
}

export const useVouchersStore = create<VouchersState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchRecent: async (limit = 50) => {
    set({ loading: true, error: null });
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("vouchers")
        .select(
          "id,voucher_code,tour_name,seller_id,created_at,embark_date,status,deleted,partial_amount,embark_amount"
        )
        .eq("deleted", false)
        .eq("seller_id", uid)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      set({ items: (data ?? []) as Voucher[] });
    } catch (e: unknown) {
      const anyErr = e as { message?: string };
      const msg = e instanceof Error ? e.message : anyErr.message ?? String(e);
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },
}));
