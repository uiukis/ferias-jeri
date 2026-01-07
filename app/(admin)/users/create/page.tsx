"use client";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Field from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUserMutation } from "@/hooks/mutations/use-admin-users";
import {
  createUserSchema,
  type CreateUserFormValues,
} from "@/schemas/users/create";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "seller" },
  });
  const createUser = useCreateUserMutation();

  const onSubmit = async (values: CreateUserFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await createUser.mutateAsync(values);
      router.push("/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader title="Criar Usuário" />
      <PageContainer className="mt-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            {error && <div className="text-destructive">{error}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nome" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  {...register("name")}
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...register("email")}
                />
              </Field>
              <Field label="Senha" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="Senha inicial"
                  {...register("password")}
                />
              </Field>
              <Field label="Perfil" htmlFor="role">
                <Select
                  value={watch("role")}
                  onValueChange={(v) =>
                    setValue("role", v as "seller" | "admin")
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Vendedor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register("role")}
                  value={watch("role") ?? "seller"}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Voltar
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
                {loading ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}
