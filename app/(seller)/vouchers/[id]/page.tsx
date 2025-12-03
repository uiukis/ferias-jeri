"use client";
import PdfDialog from "@/components/custom/pdf-dialog";
import { StatusBadge } from "@/components/custom/status-badge";
import { PageContainer, PageHeader } from "@/components/layout/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import { useGeneratePdfMutation } from "@/hooks/mutations/use-pdf";
import {
  cancelVoucher,
  excludeVoucher,
  updateVoucher,
} from "@/lib/supabase/vouchers";
import { supabase } from "@/lib/supabaseClient";
import { usePdfStore } from "@/stores/pdf";
import type { Voucher } from "@/stores/vouchers";
import { motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  FileDown,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const p = useParams();
  const paramId = String((p as Record<string, string>).id ?? "");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<
    | (Voucher & {
        client_name?: string | null;
        client_phone?: string | null;
        adults?: number | null;
        children?: number | null;
        embark_location?: string | null;
        embark_time?: string | null;
        notes?: string | null;
        embark_date?: string | null;
      })
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const pdfOpen = usePdfStore((s) => s.open);
  const pdfLoading = usePdfStore((s) => s.loading);
  const pdfUrl = usePdfStore((s) => s.url);
  const setPdfOpen = (v: boolean) =>
    v
      ? usePdfStore.getState().openDialog()
      : usePdfStore.getState().closeDialog();
  const setPdfLoading = (v: boolean) => usePdfStore.getState().setLoading(v);
  const setPdfUrl = (u: string | null) => usePdfStore.getState().setUrl(u);
  const setPdfFileName = (n: string) => usePdfStore.getState().setFileName(n);
  const generatePdf = useGeneratePdfMutation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErrorMsg(null);
      setLoading(true);
      const idOrCode = paramId;
      const isUuid = (s: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          s
        );
      const isCode = (s: string) => /^VC-\d{6}-\d{3}$/.test(s);
      if (!idOrCode || idOrCode === "undefined") {
        setErrorMsg("Identificador inválido.");
        setLoading(false);
        return;
      }
      const query = supabase.from("vouchers").select("*");
      const builder = isUuid(idOrCode)
        ? query.eq("id", idOrCode)
        : isCode(idOrCode)
        ? query.eq("voucher_code", idOrCode)
        : query.eq("id", idOrCode);
      const { data, error } = await builder.maybeSingle();
      if (!mounted) return;
      if (error) {
        const anyErr = error as { code?: string; message?: string };
        if (anyErr.code === "22P02") {
          setErrorMsg(
            "Erro de conversão de tipos (22P02). O identificador informado não é um UUID válido."
          );
        } else {
          setErrorMsg(anyErr.message ?? String(error));
        }
      } else if (!data) {
        setErrorMsg("Voucher não encontrado.");
      } else {
        setVoucher(data);
        if (isUuid(idOrCode) && data?.voucher_code) {
          try {
            router.replace(`/vouchers/${data.voucher_code}`);
          } catch {}
        }
        try {
          const status = String(data?.status ?? "");
          const embark = data?.embark_date
            ? new Date(String(data.embark_date))
            : null;
          if (
            embark &&
            embark < new Date() &&
            status !== "completed" &&
            status !== "cancelled" &&
            status !== "expired"
          ) {
            await updateVoucher(data.id, { status: "expired" });
            const { data: refreshed } = await supabase
              .from("vouchers")
              .select("*")
              .eq("id", data.id)
              .single();
            setVoucher(refreshed ?? data);
          }
        } catch {}
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [paramId, router]);

  const currency = (n: number) =>
    Number(n || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const onDelete = async () => {
    setDeleting(true);
    try {
      const id = voucher?.id ?? paramId;
      await excludeVoucher(id);
      setDeleted(true);
      setTimeout(() => {
        router.replace("/vouchers");
      }, 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);
  const onCancel = async () => {
    setCancelling(true);
    try {
      const id = voucher?.id ?? paramId;
      await cancelVoucher(id);
      const { data } = await supabase
        .from("vouchers")
        .select("*")
        .eq("id", id)
        .single();
      setVoucher(data ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  const statusNow = String(voucher?.status ?? "");
  const isCancelled = statusNow === "cancelled";
  const isExpired = statusNow === "expired";
  const isCompleted = statusNow === "completed";
  const canCancel = !isExpired && !isCancelled && !deleted;
  const canExclude = !isCancelled && !deleted;
  const canFinalize =
    !isExpired && !isCancelled && !deleted && statusNow === "active";

  const [finalizing, setFinalizing] = useState(false);
  const onFinalize = async () => {
    setFinalizing(true);
    try {
      const id = voucher?.id ?? paramId;
      await updateVoucher(id, { status: "completed" });
      const { data } = await supabase
        .from("vouchers")
        .select("*")
        .eq("id", id)
        .single();
      setVoucher(data ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <main className="relative min-h-screen">
      <PageHeader
        title={`Voucher ${voucher?.voucher_code ?? ""}`}
        right={<StatusBadge value={String(voucher?.status ?? "-")} />}
      />
      <PageContainer className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
        {errorMsg && (
          <Card className="md:col-span-2">
            <CardContent className="p-4 text-destructive">
              {errorMsg}
            </CardContent>
          </Card>
        )}
        {loading && (
          <>
            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-48" />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/5" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {!loading && !errorMsg && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Nome</div>
                    <div className="text-sm font-medium">
                      {voucher?.client_name ?? "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Contato</div>
                    <div className="text-sm font-medium">
                      {voucher?.client_phone ?? "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Viajantes
                    </div>
                    <div className="text-sm font-medium">
                      {voucher
                        ? `${voucher.adults ?? 1} adulto(s), ${
                            voucher.children ?? 0
                          } criança(s)`
                        : "-"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Pacote</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm font-semibold">
                      {voucher?.tour_name ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Local embarque: {voucher?.embark_location ?? "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Horário embarque: {voucher?.embark_time ?? "-"}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Data</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Data de emissão
                      </div>
                      <div className="text-sm font-medium">
                        {voucher?.created_at
                          ? new Date(voucher.created_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Embarque
                      </div>
                      <div className="text-sm font-medium">
                        {voucher?.embark_date
                          ? new Date(voucher.embark_date).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Preço e Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        Status
                      </div>
                      <StatusBadge value={String(voucher?.status ?? "-")} />
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold">
                        {currency(
                          Number(voucher?.partial_amount ?? 0) +
                            Number(voucher?.embark_amount ?? 0)
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex gap-2">
                    {!isCompleted && (
                      <Button variant="outline" disabled>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        if (!voucher || pdfLoading) return;
                        setPdfLoading(true);
                        try {
                          const ext = voucher as Voucher & {
                            client_name?: string | null;
                            client_phone?: string | null;
                            adults?: number | null;
                            children?: number | null;
                            embark_location?: string | null;
                            embark_time?: string | null;
                            embark_date?: string | null;
                            notes?: string | null;
                          };
                          const vp = Number(voucher.partial_amount ?? 0);
                          const ve = Number(voucher.embark_amount ?? 0);
                          const payload = {
                            templateName: "voucher_default",
                            data: {
                              item: {
                                voucher_code: voucher.voucher_code,
                                tour_name: voucher.tour_name,
                                client_name: ext.client_name ?? "",
                                client_phone: ext.client_phone ?? "",
                                embark_location: ext.embark_location ?? "",
                                embark_time: ext.embark_time ?? "",
                                embark_date: ext.embark_date ?? "",
                                embark_date_br: ext.embark_date
                                  ? new Date(
                                      String(ext.embark_date)
                                    ).toLocaleDateString("pt-BR")
                                  : "",
                                adults: ext.adults ?? 1,
                                children: ext.children ?? 0,
                                notes: ext.notes ?? "",
                                partial_amount: vp,
                                embark_amount: ve,
                                partial_amount_br: vp
                                  .toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })
                                  .replace("R$", ""),
                                embark_amount_br: ve
                                  .toLocaleString("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  })
                                  .replace("R$", ""),
                                status: voucher.status ?? "",
                                finalized:
                                  String(voucher.status) === "completed",
                                logo_url: "",
                              },
                            },
                          };
                          const blob = await generatePdf.mutateAsync(payload);
                          const url = URL.createObjectURL(blob);
                          setPdfFileName(
                            `${voucher.voucher_code ?? "voucher"}.pdf`
                          );
                          setPdfUrl(url);
                          setPdfOpen(true);
                        } finally {
                          setPdfLoading(false);
                        }
                      }}
                      disabled={!voucher || pdfLoading}
                    >
                      {pdfLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar PDF
                        </>
                      )}
                    </Button>
                    {canFinalize && !isCompleted && (
                      <Button
                        variant="outline"
                        onClick={onFinalize}
                        disabled={finalizing}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {finalizing ? "Finalizando..." : "Finalizar"}
                      </Button>
                    )}
                  </div>
                  {!isCompleted && canExclude && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        {!deleted ? (
                          <>
                            <AlertDialogTitle>
                              Excluir voucher?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O voucher será
                              marcado como excluído e removido da listagem.
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={onDelete}
                                disabled={deleting}
                              >
                                {deleting
                                  ? "Excluindo..."
                                  : "Confirmar exclusão"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-destructive"
                            >
                              Excluído
                            </motion.div>
                          </div>
                        )}
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {!isCompleted && canCancel && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={cancelling || deleted}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Cancelar voucher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O status será alterado para cancelado, mantendo o
                          registro.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={onCancel}
                            disabled={cancelling}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageContainer>
      <PdfDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        loading={pdfLoading}
        blobUrl={pdfUrl}
      />
    </main>
  );
}
