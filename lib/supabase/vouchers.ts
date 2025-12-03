import { createActivity } from "@/lib/supabase/activities";
import { supabase } from "@/lib/supabaseClient";
import type { Voucher } from "@/stores/vouchers";

export type VoucherInsert = {
  tour_name: string;
  client_name?: string | null;
  client_phone?: string | null;
  adults?: number;
  children?: number;
  embark_location?: string | null;
  embark_time?: string | null;
  embark_date?: string | null;
  partial_amount?: number;
  embark_amount?: number;
  notes?: string | null;
};

function formatVoucherCode(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `VC-${year}${month}-${rand}`;
}

async function generateUniqueVoucherCode(baseDate: Date) {
  for (let i = 0; i < 25; i++) {
    const code = formatVoucherCode(baseDate);
    const { data } = await supabase
      .from("vouchers")
      .select("id")
      .eq("voucher_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Não foi possível gerar código único para o voucher");
}

export async function createVoucher(data: VoucherInsert) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const voucher_code = await generateUniqueVoucherCode(new Date());
  const payload = { ...data, seller_id: uid, voucher_code };
  const { data: inserted, error } = await supabase
    .from("vouchers")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    const anyErr = error as { code?: string; message?: string };
    if (anyErr.code === "22P02") {
      throw new Error(
        "Erro de conversão de tipos (22P02). Verifique datas e valores numéricos."
      );
    }
    throw error;
  }
  try {
    await createActivity({
      seller_id: uid,
      type: "voucher_created",
      title: "Novo voucher criado",
      subtitle: inserted.tour_name,
      amount: null,
      voucher_id: inserted.id,
      note: null,
    });
  } catch {}
  return inserted;
}

export async function updateVoucher(
  id: string,
  data: Partial<VoucherInsert & { status?: string }>
) {
  const { data: before } = await supabase
    .from("vouchers")
    .select("*")
    .eq("id", id)
    .single();
  const { data: updated, error } = await supabase
    .from("vouchers")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  try {
    if (before) {
      const prevParcial = Number(before.partial_amount || 0);
      const prevEmbarque = Number(before.embark_amount || 0);
      const newParcial = Number(updated.partial_amount || 0);
      const newEmbarque = Number(updated.embark_amount || 0);
      if (newParcial > prevParcial) {
        await createActivity({
          seller_id: uid!,
          type: "voucher_finalized", 
          title: `Voucher atualizado`,
          subtitle: updated.tour_name,
          amount: newParcial - prevParcial,
          voucher_id: updated.id,
          note: "Pagamento parcial registrado",
        });
      }
      if (newEmbarque > prevEmbarque) {
        await createActivity({
          seller_id: uid!,
          type: "payment_received",
          title: "Pagamento recebido",
          subtitle: updated.tour_name,
          amount: newEmbarque - prevEmbarque,
          voucher_id: updated.id,
          note: null,
        });
      }
      if (data.status === "completed") {
        const received = newEmbarque > 0;
        if (!received) {
          throw new Error(
            "Para finalizar, é necessário registrar o valor de embarque"
          );
        }
        await createActivity({
          seller_id: uid!,
          type: "voucher_finalized",
          title: "Voucher finalizado",
          subtitle: updated.tour_name,
          amount: newEmbarque,
          voucher_id: updated.id,
          note: null,
        });
      }
    }
  } catch {}
  return updated;
}

export async function excludeVoucher(id: string) {
  const { data: updated, error } = await supabase
    .from("vouchers")
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
      status: "excluded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return updated;
}

export async function cancelVoucher(id: string) {
  const { data: updated, error } = await supabase
    .from("vouchers")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return updated;
}

export async function autoExpireVouchers(items: Voucher[]) {
  const now = new Date();
  for (const v of items) {
    if (v.deleted) continue;
    const status = String(v.status ?? "");
    if (status === "completed" || status === "cancelled" || status === "expired") continue;
    const d = v.embark_date ? new Date(String(v.embark_date)) : null;
    if (d && d < now) {
      try {
        const updated = await updateVoucher(v.id, { status: "expired" });
        try {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth.user?.id;
          if (uid) {
            await createActivity({
              seller_id: uid,
              type: "voucher_expired",
              title: "Voucher expirado",
              subtitle: updated?.tour_name ?? v.tour_name ?? null,
              amount: null,
              voucher_id: v.id,
              note: "Expirado automaticamente por data de embarque passada",
            });
          }
        } catch {}
      } catch {}
    }
  }
}

export async function listVouchersForSeller() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("deleted", false)
    .eq("seller_id", uid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listAllVouchersForAdmin() {
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export type VoucherStatusFilter = "all" | "active" | "completed" | "cancelled" | "expired";

export async function listVouchersForSellerPaged(options: {
  page: number;
  pageSize: number;
  status?: VoucherStatusFilter;
  date?: string | null;
}) {
  const { page, pageSize, status = "all", date } = options;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  let query = supabase
    .from("vouchers")
    .select(
      "id,voucher_code,tour_name,created_at,embark_date,partial_amount,embark_amount,status,deleted",
      { count: "exact" }
    )
    .eq("deleted", false)
    .eq("seller_id", uid)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (date) {
    const d = new Date(String(date));
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    query = query
      .gte("embark_date", start.toISOString())
      .lt("embark_date", end.toISOString());
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as Voucher[], total: count ?? 0 };
}

export async function resetCancelledToActiveForSeller() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("vouchers")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("seller_id", uid)
    .eq("deleted", false)
    .eq("status", "cancelled");
  if (error) throw error;
}

export async function resetAllStatusesToActiveForSeller() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("vouchers")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("seller_id", uid)
    .eq("deleted", false)
    .in("status", ["expired", "completed", "cancelled"]);
  if (error) throw error;
}

export async function createLog(
  ref_table: string,
  ref_id: string | null,
  action: string,
  payload: Record<string, unknown> | null
) {
  const { data: inserted, error } = await supabase
    .from("logs")
    .insert({ ref_table, ref_id, action, payload })
    .select("*")
    .single();
  if (error) throw error;
  return inserted;
}
