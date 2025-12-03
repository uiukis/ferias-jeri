"use client";
import { DatePicker } from "@/components/custom/date-picker";
import { PageContainer, PageHeader } from "@/components/layout/page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Field from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import {
  currencyToNumber,
  maskCurrency,
  maskPhone,
  maskTime,
} from "@/lib/forms/masks";
import { createVoucher } from "@/lib/supabase/vouchers";
import {
  createVoucherSchema,
  type CreateVoucherFormValues,
} from "@/schemas/vouchers/create";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

function PageInner() {
  useAuthGuard({ requireAuth: true, requiredRole: "seller" });
  const router = useRouter();
  const [createdOpen, setCreatedOpen] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  type FormValues = CreateVoucherFormValues;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(createVoucherSchema),
    defaultValues: {
      client_name: "",
      client_phone: "",
      tour_name: "",
      partial_amount: "",
      embark_amount: "",
      adults: 1,
      children: 0,
      embark_location: "",
      embark_time: "",
      embark_date: undefined as unknown as Date,
      notes: "",
    },
  });

  const clearForm = () => {
    reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const inserted = await createVoucher({
        tour_name: values.tour_name,
        client_name: values.client_name,
        client_phone: values.client_phone,
        adults: Number(values.adults),
        children: Number(values.children || 0),
        embark_location: values.embark_location,
        embark_time: values.embark_time,
        embark_date: values.embark_date?.toISOString(),
        partial_amount: currencyToNumber(values.partial_amount),
        embark_amount: currencyToNumber(values.embark_amount),
        notes: values.notes || "",
      });
      setCreatedCode(String(inserted?.voucher_code ?? ""));
      setCreatedOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(
        msg.includes("22P02")
          ? "Erro de conversão de tipos. Verifique datas e valores numéricos."
          : msg
      );
    }
  });

  return (
    <main className="relative min-h-screen">
      <PageHeader title="Criar Voucher" />
      <PageContainer className="mt-4">
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onSubmit={onSubmit}
        >
          <Card>
            <CardHeader>
              <CardTitle>Dados do Voucher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field
                  label="Nome do Cliente"
                  htmlFor="client_name"
                  error={errors.client_name?.message}
                  className="md:col-span-2"
                >
                  <Input
                    id="client_name"
                    placeholder="Nome completo"
                    {...register("client_name")}
                  />
                </Field>
                <Field
                  label="Telefone"
                  htmlFor="client_phone"
                  error={errors.client_phone?.message}
                >
                  <Input
                    id="client_phone"
                    placeholder="(xx) xxxxx-xxxx"
                    {...register("client_phone", {
                      onChange: (e) => {
                        const masked = maskPhone(e.target.value);
                        setValue("client_phone", masked, {
                          shouldValidate: true,
                        });
                      },
                    })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field
                  label="Pacote / Passeio"
                  htmlFor="tour_name"
                  error={errors.tour_name?.message}
                  className="md:col-span-2"
                >
                  <Input
                    id="tour_name"
                    placeholder="Ex.: Passeio de Buggy"
                    {...register("tour_name")}
                  />
                </Field>
                <Field
                  label="Adultos"
                  htmlFor="adults"
                  error={errors.adults?.message}
                >
                  <Input
                    id="adults"
                    type="number"
                    min={1}
                    {...register("adults", { valueAsNumber: true })}
                  />
                </Field>
                <Field
                  label="Crianças"
                  htmlFor="children"
                  error={errors.children?.message}
                >
                  <Input
                    id="children"
                    type="number"
                    min={0}
                    {...register("children", { valueAsNumber: true })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field
                  label="Local de Embarque"
                  htmlFor="embark_location"
                  error={errors.embark_location?.message}
                  className="md:col-span-2"
                >
                  <Input
                    id="embark_location"
                    placeholder="Ponto de encontro"
                    {...register("embark_location")}
                  />
                </Field>
                <Field
                  label="Data de Embarque"
                  htmlFor="embark_date"
                  error={errors.embark_date?.message}
                >
                  <DatePicker
                    date={undefined}
                    setDate={(d) =>
                      setValue("embark_date", d as Date, {
                        shouldValidate: true,
                      })
                    }
                    placeholder="dd/mm/aaaa"
                  />
                </Field>
                <Field
                  label="Horário de Embarque"
                  htmlFor="embark_time"
                  error={errors.embark_time?.message}
                >
                  <Input
                    id="embark_time"
                    placeholder="Ex.: 08:30"
                    {...register("embark_time", {
                      onChange: (e) => {
                        const masked = maskTime(e.target.value);
                        setValue("embark_time", masked, {
                          shouldValidate: true,
                        });
                      },
                    })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="grid gap-4 md:col-span-1">
                  <Field
                    label="Preço (R$)"
                    htmlFor="partial_amount"
                    error={errors.partial_amount?.message}
                  >
                    <Input
                      id="partial_amount"
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                      {...register("partial_amount", {
                        onChange: (e) => {
                          const masked = maskCurrency(e.target.value);
                          setValue("partial_amount", masked, {
                            shouldValidate: true,
                          });
                        },
                      })}
                    />
                  </Field>
                  <Field
                    label="Valor no Embarque (R$)"
                    htmlFor="embark_amount"
                    error={errors.embark_amount?.message}
                  >
                    <Input
                      id="embark_amount"
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                      {...register("embark_amount", {
                        onChange: (e) => {
                          const masked = maskCurrency(e.target.value);
                          setValue("embark_amount", masked, {
                            shouldValidate: true,
                          });
                        },
                      })}
                    />
                  </Field>
                </div>
                <Field
                  label="Observações"
                  htmlFor="notes"
                  error={errors.notes?.message}
                  className="md:col-span-2"
                >
                  <Textarea
                    id="notes"
                    className="h-10/12 bg-transparent"
                    placeholder="Notas ou pedidos especiais"
                    {...register("notes")}
                  />
                </Field>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <Button variant="ghost" type="button" onClick={clearForm}>
                Limpar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Gerando" : "Gerar Voucher"}
              </Button>
            </CardFooter>
          </Card>

          <AlertDialog open={createdOpen}>
            <AlertDialogContent>
              <AlertDialogTitle>Voucher criado com sucesso</AlertDialogTitle>
              <AlertDialogDescription>
                Código: {createdCode || "-"}
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setCreatedOpen(false);
                    reset();
                  }}
                >
                  Criar outro
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setCreatedOpen(false);
                    router.replace("/vouchers");
                  }}
                >
                  Ir para Vouchers
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.form>
      </PageContainer>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen">
          <PageHeader title="Criar Voucher" />
          <PageContainer className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-36" />
                </div>
              </CardContent>
            </Card>
          </PageContainer>
        </main>
      }
    >
      <PageInner />
    </Suspense>
  );
}
