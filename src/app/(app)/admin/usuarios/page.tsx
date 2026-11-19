import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/layout/stat-card";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { formatNumberBR } from "@/shared/lib/format";
import { UsersTable } from "@/features/administracao/components/users-table";

export const metadata: Metadata = {
  title: "Usuários",
  robots: { index: false, follow: false },
};

type AdminUser = {
  id: string;
  nome_completo: string;
  email: string;
  tipo_usuario: string;
  status: string;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  total_indicacoes: number;
};

export default async function AdminUsersPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/usuarios");
  if (!session.profile) redirect("/sem-acesso");
  if (session.profile.tipo_usuario !== "admin") redirect("/admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_listar_usuarios");

  if (error) {
    console.error("Erro ao listar usuários:", error.message);
  }

  const users = error ? null : ((data ?? []) as AdminUser[]);

  const total = users?.length ?? 0;
  const admins = users?.filter((u) => u.tipo_usuario === "admin").length ?? 0;
  const gestores = users?.filter((u) => u.tipo_usuario === "comercial").length ?? 0;
  const indicadores = users?.filter((u) => u.tipo_usuario === "indicador").length ?? 0;
  const ativos = users?.filter((u) => u.status === "ativo").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
            <UserCog className="size-3.5" aria-hidden="true" />
            Gestão de usuários
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
            Usuários cadastrados
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Visualize, promova e gerencie os acessos da plataforma.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 ring-inset">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Administrador
        </span>
      </div>

      {users === null ? (
        <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
          <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />
          <AlertTitle className="text-sm font-semibold">
            Não foi possível carregar os usuários
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-900/80">
            Verifique a conexão com o banco de dados.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <section aria-label="Resumo" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={formatNumberBR(total)} description="Usuários cadastrados." icon={Users} tone="brand" />
            <StatCard label="Administradores" value={formatNumberBR(admins)} description="Acesso completo." icon={ShieldCheck} tone="violet" />
            <StatCard label="Comercial" value={formatNumberBR(gestores)} description="Equipe operacional." icon={UserCog} tone="cyan" />
            <StatCard label="Indicadores" value={formatNumberBR(indicadores)} description="Usuários comuns." icon={Users} tone="brand" />
          </section>

          <UsersTable users={users} />
        </>
      )}

      <div className="flex justify-start">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <ArrowLeft className="size-3.5 rotate-180" aria-hidden="true" />
            Voltar para o painel
          </Link>
        </Button>
      </div>
    </div>
  );
}
