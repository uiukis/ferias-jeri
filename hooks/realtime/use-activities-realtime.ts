import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useActivitiesRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => {
          qc.invalidateQueries({ queryKey: ["activities", "seller"] });
        }
      );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

