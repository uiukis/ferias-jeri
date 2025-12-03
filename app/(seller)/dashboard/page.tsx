"use client";
import { CtaButton, OutlineButton } from "@/components/custom/button";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import { useSellerActivitiesQuery } from "@/hooks/queries/use-activities";
import { useSellerVouchersQuery } from "@/hooks/queries/use-vouchers";
import { useActivitiesRealtime } from "@/hooks/realtime/use-activities-realtime";
import type { Voucher } from "@/stores/vouchers";
import { motion } from "framer-motion";
import { BadgeDollarSign, Ban, Eye, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";

function PageInner() {
  const router = useRouter();
  const { data, isLoading: vouchersLoading } = useSellerVouchersQuery({
    staleTime: 1000 * 30,
    limit: 50,
  });
  useActivitiesRealtime();

  const currency = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const vouchers = (data ?? []) as Voucher[];
  const activeCount = vouchers.filter((v) => v.status === "active").length;
  const monthSales = vouchers
    .filter(
      (v) =>
        new Date(v.created_at) >= monthStart &&
        String(v.status) !== "expired" &&
        String(v.status) !== "cancelled"
    )
    .reduce(
      (acc, v) => acc + (v.partial_amount ?? 0) + (v.embark_amount ?? 0),
      0
    );
  const totalReceber = vouchers
    .filter((v) => v.status === "active")
    .reduce((acc, v) => acc + (v.embark_amount ?? 0), 0);

  const metricsVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  };
  const listVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useSellerActivitiesQuery(20, 1000 * 30);
  const activities = activitiesData ?? [];

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader title="Dashboard" />
      <PageContainer className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={metricsVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">
                Vouchers Ativos
              </div>
              <div className="mt-1 text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial="hidden" animate="show" variants={metricsVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Vendas do Mês</div>
              <div className="mt-1 text-2xl font-bold">
                {currency(monthSales)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial="hidden"
          animate="show"
          variants={metricsVariants}
          className="md:col-span-2"
        >
          <Card>
            <CardContent className="p-6">
              {vouchersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-7 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Total a Receber
                  </div>
                  <div className="mt-1 text-2xl font-bold">
                    {currency(totalReceber)}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </PageContainer>

      <PageContainer className="mt-8">
        <div className="text-lg font-semibold">Atividade Recente</div>
        <div className="mt-2 text-xs text-muted-foreground">
          Para finalizar um voucher é necessário registrar o valor de embarque.
        </div>
        {activitiesError && (
          <div className="mt-2 text-destructive">
            {activitiesError instanceof Error
              ? activitiesError.message
              : String(activitiesError)}
          </div>
        )}
        <motion.ul
          className="mt-3 space-y-3"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          {activitiesLoading && (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.li key={`sk-${i}`} variants={itemVariants}>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.li>
              ))}
            </>
          )}
          {!activitiesLoading &&
            activities.map((a) => (
              <motion.li key={a.id} variants={itemVariants}>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {a.type === "voucher_created" && (
                        <Plus className="h-5 w-5 text-emerald-500" />
                      )}
                      {a.type === "voucher_finalized" && (
                        <ShoppingCart className="h-5 w-5 text-sky-500" />
                      )}
                      {a.type === "payment_received" && (
                        <BadgeDollarSign className="h-5 w-5 text-indigo-500" />
                      )}
                      {a.type === "voucher_expired" && (
                        <Ban className="h-5 w-5 text-rose-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.subtitle ?? "-"} ·{" "}
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold">
                        {typeof a.amount === "number"
                          ? currency(Number(a.amount))
                          : ""}
                      </div>
                      {a.voucher_id && (
                        <OutlineButton
                          onClick={() => {
                            const v = vouchers.find(
                              (vv) => vv.id === a.voucher_id
                            );
                            const code = v?.voucher_code;
                            router.push(`/vouchers/${code ?? a.voucher_id}`);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <Eye className="mr-2 h-4 w-4" /> Visualizar voucher
                        </OutlineButton>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          {activities.length === 0 &&
            !activitiesLoading &&
            !activitiesError && (
              <motion.li variants={itemVariants}>
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Sem atividade recente
                  </CardContent>
                </Card>
              </motion.li>
            )}
        </motion.ul>
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
          <PageHeader title="Dashboard" />
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
