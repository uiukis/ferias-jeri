"use client";
import { CtaButton } from "@/components/custom/button";
import { DatePicker } from "@/components/custom/date-picker";
import { Table } from "@/components/custom/table";
import { VoucherCardList } from "@/components/custom/voucher-card-list";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSellerVouchersPagedQuery } from "@/hooks/queries/use-vouchers";
import { useVouchersRealtime } from "@/hooks/realtime/use-vouchers-realtime";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import type { Voucher } from "@/stores/vouchers";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

type StatusFilter = "all" | "active" | "completed" | "cancelled" | "expired";

function PageInner() {
  useAuthGuard({ requireAuth: true, requiredRole: "seller" });
  useVouchersRealtime();
  const router = useRouter();
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(
    [10, 25, 50].includes(10) ? 10 : 10
  );

  const { data, isLoading, error } = useSellerVouchersPagedQuery({
    page,
    pageSize,
    status: status,
    date: date,
    staleTime: 1000 * 30,
  });

  const vouchers = (data?.items ?? []) as Voucher[];
  const total = Number(data?.total ?? 0);

  console.log(total);

  const currency = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const items: { label: string; value: StatusFilter }[] = [
    { label: "Todos", value: "all" },
    { label: "Ativos", value: "active" },
    { label: "Completados", value: "completed" },
    { label: "Cancelados", value: "cancelled" },
    { label: "Expirados", value: "expired" },
  ];

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
        label: "Cancelado",
        className:
          "inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700",
      },
      expired: {
        label: "Expirado",
        className:
          "inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700",
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

  const columns: ColumnDef<Voucher>[] = [
    {
      header: "Código",
      accessorKey: "voucher_code",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {String(row.original.voucher_code ?? "-")}
        </span>
      ),
    },
    {
      header: "Passeio",
      accessorKey: "tour_name",
      cell: ({ row }) => (
        <span className="font-medium">
          {String(row.original.tour_name ?? "-")}
        </span>
      ),
    },
    {
      header: "Data de Embarque",
      accessorKey: "embark_date",
      cell: ({ row }) =>
        formatDate(new Date(String(row.original.embark_date)), "dd/MM/yyyy"),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusPill value={String(row.original.status)} />,
    },
    {
      header: "Parcial",
      accessorKey: "partial_amount",
      cell: ({ row }) =>
        typeof row.original.partial_amount === "number"
          ? currency(Number(row.original.partial_amount))
          : "-",
    },
    {
      header: "Embarque",
      accessorKey: "embark_amount",
      cell: ({ row }) =>
        typeof row.original.embark_amount === "number"
          ? currency(Number(row.original.embark_amount))
          : "-",
    },
    {
      header: "Total",
      cell: ({ row }) => {
        const vp = Number(row.original.partial_amount ?? 0);
        const ve = Number(row.original.embark_amount ?? 0);
        return <span className="font-semibold">{currency(vp + ve)}</span>;
      },
    },
  ];

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader title="Vouchers" />
      <PageContainer className="mt-4 space-y-4">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-4">Carregando filtros...</CardContent>
            </Card>
          }
        >
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Status</div>
                  <LayoutGroup>
                    <div className="relative flex w-full max-w-full rounded-full bg-primary p-1 overflow-x-auto">
                      {items.map((it) => {
                        const active = status === it.value;
                        return (
                          <Button
                            key={it.value}
                            onClick={() => setStatus(it.value)}
                            className={
                              `relative z-10 px-4 py-2 text-sm bg-transparent shrink-0` +
                              (active
                                ? " font-medium text-foreground rounded-full"
                                : " text-muted-foreground")
                            }
                          >
                            <AnimatePresence>
                              {active && (
                                <motion.span
                                  layoutId="status-pill"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 40,
                                  }}
                                  className="absolute inset-0 rounded-full bg-secondary shadow-sm"
                                />
                              )}
                            </AnimatePresence>
                            <span className="relative">{it.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </LayoutGroup>
                </div>
                <div className="space-y-2 md:justify-self-end">
                  <div className="text-sm font-semibold">Data de criação</div>
                  <DatePicker
                    date={date}
                    setDate={(d) => setDate(d)}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
              </div>

              {error && (
                <div className="text-destructive">
                  {error instanceof Error ? error.message : String(error)}
                </div>
              )}

              <div className="hidden md:block">
                <Table
                  className="border-none rounded-none"
                  columns={columns}
                  data={vouchers}
                  loading={isLoading}
                  page={page}
                  pageSize={pageSize}
                  totalRecords={total}
                  onPageSizeChange={(n) => setPageSize(n)}
                  pageSizeOptions={[10, 25, 50]}
                  onPageChange={setPage}
                  onRowClick={(row) => {
                    const code = row.voucher_code;
                    const id = row.id;
                    if (!code && !id) return;
                    router.push(`/vouchers/${code ?? id}`);
                  }}
                />
              </div>

              <div className="md:hidden">
                <VoucherCardList vouchers={vouchers} loading={isLoading} />
              </div>
            </CardContent>
          </Card>
        </Suspense>
      </PageContainer>

      <div className="fixed bottom-10 right-10">
        <CtaButton href="/vouchers/create">Criar Voucher</CtaButton>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen">
          <PageHeader title="Vouchers" />
          <PageContainer className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4">Carregando...</CardContent>
            </Card>
          </PageContainer>
        </main>
      }
    >
      <PageInner />
    </Suspense>
  );
}
