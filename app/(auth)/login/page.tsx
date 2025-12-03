"use client";
import LogoFont from "@/components/icons/LogoFont";
import MinimalLogo from "@/components/icons/MinimalLogo";
import BlurBg from "@/components/ui/blur-bg";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Field from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Skeleton from "@/components/ui/skeleton";
import { loginSchema, type LoginFormValues } from "@/schemas/auth/login";
import { useAuthStore } from "@/stores/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = LoginFormValues;

function PageInner() {
  const login = useAuthStore((s) => s.login);
  const loadingStore = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Falha no login");
    }
  };

  useEffect(() => {
    if (loadingStore) return;
    if (!user) return;
    const dest = role === "admin" ? "/admin/reports" : "/dashboard";
    router.replace(dest);
  }, [user, role, loadingStore, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <BlurBg src="/images/background.jpg" alt="Fundo" />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="w-full backdrop-blur-sm bg-white/85">
          <CardHeader>
            <div className="flex flex-col items-center justify-center">
              <MinimalLogo className="h-16 w-auto" />
              <LogoFont className="h-9 w-auto" />
            </div>
            <CardDescription className="text-center">
              Acesse com seu email e senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Field
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                />
              </Field>
              <Field
                label="Senha"
                htmlFor="password"
                error={errors.password?.message}
              >
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  {...register("password")}
                />
              </Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <CardFooter className="p-0">
                <motion.div whileTap={{ scale: 0.98 }} className="w-full">
                  <Button
                    type="submit"
                    disabled={loadingStore}
                    className="w-full"
                  >
                    {loadingStore ? "Entrando" : "Login"}
                  </Button>
                </motion.div>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-10 w-40 mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        </main>
      }
    >
      <PageInner />
    </Suspense>
  );
}
