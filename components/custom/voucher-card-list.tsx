"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { Voucher } from "@/stores/vouchers";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  vouchers: Voucher[];
  loading?: boolean;
};

export function VoucherCardList({ vouchers, loading = false }: Props) {
  const router = useRouter();
  const currency = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function StatusPill({ value }: { value: string }) {
    const map: Record<string, { label: string; className: string }> = {
      active: {
        label: "Ativo",
        className:
          "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700",
      },
      completed: {
        label: "Completado",
        className:
          "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700",
      },
      cancelled: {
        label: "Expirado",
        className:
          "inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700",
      },
    };
    const s = String(value ?? "-");
    const m = map[s] ?? {
      label: s,
      className:
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground",
    };
    return <span className={m.className}>{m.label}</span>;
  }
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={`sk-${i}`}>
            <CardContent className="p-4 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {vouchers.map((v, idx) => {
        const vp = Number(v.partial_amount ?? 0);
        const ve = Number(v.embark_amount ?? 0);
        const total = vp + ve;
        const passeioDate = v.embark_date
          ? new Date(String(v.embark_date)).toLocaleDateString("pt-BR")
          : "-";
        return (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
          >
            <Card
              onClick={() => {
                const code = v.voucher_code;
                const id = v.id;
                if (!code && !id) return;
                router.push(`/vouchers/${code ?? id}`);
              }}
              className="cursor-pointer"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{v.tour_name}</div>
                  <ChevronRight className="h-4 w-4" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Data: {passeioDate}
                </div>
                <div className="flex items-center justify-between">
                  <StatusPill value={String(v.status)} />
                  <div className="text-sm font-semibold">{currency(total)}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      {vouchers.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhum registro encontrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}
