"use client";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Field from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!password || password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });
      if (error) throw error;
      document.cookie = `auth_mcp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader title="Primeiro Acesso · Alterar Senha" />
      <PageContainer className="mt-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            {error && <div className="text-destructive">{error}</div>}
            {saved && !error && (
              <div className="text-emerald-600 text-sm">Senha atualizada com sucesso.</div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nova senha" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirmar senha" htmlFor="confirm">
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </CardFooter>
        </Card>
      </PageContainer>
    </main>
  );
}
