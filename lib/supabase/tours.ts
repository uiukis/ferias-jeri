import { supabase } from "@/lib/supabaseClient";

export type Tour = {
  id: string;
  name: string;
  active: boolean;
  description?: string | null;
};

export async function listActiveTours() {
  const { data, error } = await supabase
    .from("tours")
    .select("id,name,active")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tour[];
}

export async function getTourById(id: string) {
  const { data, error } = await supabase
    .from("tours")
    .select("id,name,active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Tour | null;
}
