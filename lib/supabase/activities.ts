import { supabase } from "@/lib/supabaseClient";

export type ActivityType =
  | "voucher_created"
  | "payment_received"
  | "voucher_finalized"
  | "voucher_expired";

export type Activity = {
  id: string;
  seller_id: string;
  created_at: string;
  type: ActivityType;
  title: string;
  subtitle?: string | null;
  amount?: number | null;
  voucher_id: string;
  note?: string | null;
};

export async function createActivity(payload: Omit<Activity, "id" | "created_at">) {
  const { data: inserted, error } = await supabase
    .from("activities")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return inserted as Activity;
}

export async function listActivitiesForSeller(limit = 20) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Activity[];
}
