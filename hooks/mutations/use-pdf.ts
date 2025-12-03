import { useMutation } from "@tanstack/react-query";

type Payload = {
  templateName: string;
  data: Record<string, unknown>;
};

export function useGeneratePdfMutation() {
  return useMutation<Blob, Error, Payload>({
    mutationFn: async ({ templateName, data }) => {
      const res = await fetch("/api/pdf/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName, data }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      return await res.blob();
    },
  });
}

