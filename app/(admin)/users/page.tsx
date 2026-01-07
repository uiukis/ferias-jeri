"use client";
import { CtaButton } from "@/components/custom/button";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Skeleton from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteUserMutation } from "@/hooks/mutations/use-admin-users";
import { useAdminUsersQuery } from "@/hooks/queries/use-admin-users";
import { Suspense, useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string | null;
};

function PageInner() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error: queryError } = useAdminUsersQuery(1000 * 30);
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);
  useEffect(() => {
    if (queryError) setError(queryError.message);
  }, [queryError]);
  useEffect(() => {
    setProfiles((data ?? []) as Profile[]);
  }, [data]);

  const RoleBadge = ({ value }: { value: string }) => {
    const map: Record<string, { label: string; className: string }> = {
      admin: {
        label: "Administrador",
        className:
          "inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700",
      },
      seller: {
        label: "Vendedor",
        className:
          "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700",
      },
    };
    const s = String(value ?? "-");
    const m = map[s] ?? {
      label: s,
      className:
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground",
    };
    return <span className={m.className}>{m.label}</span>;
  };

  const del = useDeleteUserMutation();
  const onDelete = async (id: string) => {
    if (!id) return;
    const confirm = window.confirm("Excluir este usuário?");
    if (!confirm) return;
    setError(null);
    setDeletingId(id);
    try {
      await del.mutateAsync({ id });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="relative min-h-screen mb-8">
      <PageHeader
        title="Usuários"
        right={<CtaButton href="/users/create">Criar Usuário</CtaButton>}
      />
      <PageContainer className="mt-4">
        <Card>
          <CardContent className="p-4">
            {error && <div className="text-destructive">{error}</div>}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.name ?? "-"}
                      </TableCell>
                      <TableCell>{p.email ?? "-"}</TableCell>
                      <TableCell>
                        <RoleBadge value={p.role} />
                      </TableCell>
                      <TableCell>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === p.id}
                          onClick={() => onDelete(p.id)}
                        >
                          {deletingId === p.id ? "Excluindo" : "Excluir"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen">
          <PageHeader
            title="Usuários"
            right={<Skeleton className="h-10 w-40" />}
          />
          <PageContainer className="mt-4">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-full mt-2" />
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
