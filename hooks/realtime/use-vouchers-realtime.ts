import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useVouchersRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("vouchers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vouchers" },
        () => {
          qc.invalidateQueries({ queryKey: ["vouchers", "seller"] });
        }
      );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
