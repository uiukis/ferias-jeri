"use client";
import { DatePicker } from "@/components/custom/date-picker";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminVouchersQuery } from "@/hooks/queries/use-admin-vouchers";
import { listActiveTours } from "@/lib/supabase/tours";
import { supabase } from "@/lib/supabaseClient";
import { Suspense, useEffect, useState } from "react";

type Row = {
  id: string;
  voucher_code: string | null;
  client_name: string | null;
  tour_id: string | null;
  partial_amount: number | null;
  embark_amount: number | null;
  status: string | null;
  embark_date: string;
  seller?: { name: string | null } | null;
};

function PageInner() {
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const {
    data: vouchersData,
    isLoading,
    error: queryError,
  } = useAdminVouchersQuery(date, 1000 * 30);
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);
  useEffect(() => {
    setError(queryError ? queryError.message : null);
  }, [queryError]);
  useEffect(() => {
    (async () => {
      const vouchers = (vouchersData ?? []) as Array<
        Omit<Row, "seller"> & { seller_id: string | null }
      >;
      const tours = await listActiveTours().catch(() => []);
      const toursMap: Record<string, string> = {};
      for (const t of tours) toursMap[t.id] = t.name;
      const ids = Array.from(
        new Set(
          vouchers
            .map((v) => v.seller_id)
            .filter((x): x is string => typeof x === "string" && x.length > 0)
        )
      );
      const byId: Record<string, { name: string | null }> = {};
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,name")
          .in("id", ids);
        (profs ?? []).forEach((p) => {
          byId[(p as { id: string }).id] = {
            name: (p as { name: string | null }).name ?? null,
          };
        });
      }
      setRows(
        vouchers.map((v) => ({
          id: v.id,
          voucher_code: v.voucher_code ?? null,
          client_name: v.client_name ?? null,
          tour_id: v.tour_id ?? null,
          partial_amount: v.partial_amount ?? null,
          embark_amount: v.embark_amount ?? null,
          status: v.status ?? null,
          embark_date: v.embark_date,
          seller: v.seller_id
            ? byId[v.seller_id] ?? { name: null }
            : { name: null },
          tour_name: undefined,
        }))
      );
    })();
  }, [vouchersData]);

  const onChangeField = (id: string, key: keyof Row, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [key]: value as never } : r))
    );
  };

  const onSave = async (r: Row) => {
    setSavingId(r.id);
    try {
      const payload = {
        client_name: r.client_name,
        tour_id: r.tour_id,
        partial_amount: r.partial_amount,
        embark_amount: r.embark_amount,
        status: r.status,
      };
      const { error } = await supabase
        .from("vouchers")
        .update(payload)
        .eq("id", r.id);
      if (error) throw error;
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader title="Ordem de Serviços" />
      <PageContainer className="mt-4 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <div className="text-sm font-semibold">Data</div>
                <DatePicker
                  date={date}
                  setDate={setDate}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>
            {error && <div className="text-destructive">{error}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Passeio</TableHead>
                  <TableHead>Parcial</TableHead>
                  <TableHead>Embarque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8}>Carregando...</TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      Nenhum voucher para o dia selecionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.voucher_code ?? "-"}
                      </TableCell>
                      <TableCell>{r.seller?.name ?? "-"}</TableCell>
                      <TableCell>
                        <InputInline
                          value={r.client_name ?? ""}
                          onChange={(v) =>
                            onChangeField(r.id, "client_name", v)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <TourSelectInline
                          value={r.tour_id ?? ""}
                          onChange={(id) => onChangeField(r.id, "tour_id", id)}
                        />
                      </TableCell>
                      <TableCell>
                        <InputInline
                          value={toCurrency(r.partial_amount)}
                          onChange={(v) =>
                            onChangeField(
                              r.id,
                              "partial_amount",
                              fromCurrency(v)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <InputInline
                          value={toCurrency(r.embark_amount)}
                          onChange={(v) =>
                            onChangeField(
                              r.id,
                              "embark_amount",
                              fromCurrency(v)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          className="h-9 w-full rounded-md border px-2 py-1 text-sm bg-transparent"
                          value={r.status ?? "emitido"}
                          onChange={(e) =>
                            onChangeField(r.id, "status", e.target.value)
                          }
                        >
                          <option value="emitido">Emitido</option>
                          <option value="pago">Pago</option>
                          <option value="cancelado">Cancelado</option>
                          <option value="expirado">Expirado</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => onSave(r)}
                          disabled={savingId === r.id}
                        >
                          {savingId === r.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}

function toCurrency(n: number | null) {
  const v = Number(n ?? 0);
  return v
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace("R$", "")
    .trim();
}
function fromCurrency(s: string) {
  const cleaned = s
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function InputInline({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      className="h-9 w-full rounded-md border px-3 py-1 text-sm bg-transparent"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen">
          <PageHeader title="Ordem de Serviços" />
          <PageContainer className="mt-4">
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

function TourSelectInline({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [tours, setTours] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listActiveTours();
        if (cancelled) return;
        setTours(list.map((t) => ({ id: t.id, name: t.name })));
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <select
      className="h-9 w-full rounded-md border px-2 py-1 text-sm bg-transparent"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Selecione</option>
      {tours.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
