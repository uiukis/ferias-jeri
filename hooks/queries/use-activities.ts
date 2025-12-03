import type { Activity } from "@/lib/supabase/activities";
import { listActivitiesForSeller } from "@/lib/supabase/activities";
import { useQuery } from "@tanstack/react-query";

export function useSellerActivitiesQuery(limit = 20, staleTime = 1000 * 30) {
  return useQuery<Activity[]>({
    queryKey: ["activities", "seller", { limit }],
    queryFn: async () => await listActivitiesForSeller(limit),
    staleTime,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev ?? [],
  });
}
