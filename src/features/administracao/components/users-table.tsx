"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/services/supabase/client";
import { formatNumberBR } from "@/shared/lib/format";
import { getInitials } from "@/features/autenticacao/services/queries";

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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  comercial: "Comercial",
  indicador: "Indicador",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-50 text-violet-700 ring-violet-200",
  comercial: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  indicador: "bg-brand-50 text-brand-700 ring-brand-200",
};

export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      u.nome_completo.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.cidade ?? "").toLowerCase().includes(term)
    );
  });

  const handleChangeRole = (userId: string, newRole: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_alterar_permissao_usuario", {
        p_user_id: userId,
        p_novo_papel: newRole,
      });
      if (error || !data?.ok) {
        toast.error("Não foi possível alterar o perfil", {
          description: error?.message ?? "Operação não autorizada.",
        });
        return;
      }
      toast.success("Perfil atualizado");
      router.refresh();
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: string) => {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_alterar_status_usuario", {
        p_user_id: userId,
        p_novo_status: currentStatus === "ativo" ? "inativo" : "ativo",
      });
      if (error || !data?.ok) {
        toast.error("Não foi possível alterar o status", {
          description: error?.message ?? "Operação não autorizada.",
        });
        return;
      }
      toast.success("Status atualizado");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou cidade"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-muted text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">Usuário</th>
                <th className="px-4 py-3 font-bold">Local</th>
                <th className="px-4 py-3 font-bold">Perfil</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Indicações</th>
                <th className="px-4 py-3 font-bold">Desde</th>
                <th className="px-4 py-3 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-white">
                        {getInitials(u.nome_completo)}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate font-semibold text-ink">
                          {u.nome_completo}
                        </p>
                        <p className="max-w-[180px] truncate text-[10px] text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">
                    {u.cidade && u.estado ? `${u.cidade} / ${u.estado}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.tipo_usuario}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      disabled={isPending}
                      className="h-8 rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-ink"
                    >
                      <option value="indicador">Indicador</option>
                      <option value="comercial">Comercial</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id, u.status)}
                      disabled={isPending}
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                        u.status === "ativo"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-red-200"
                      }`}
                    >
                      {u.status === "ativo" ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-ink">
                    {formatNumberBR(u.total_indicacoes)}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/admin/indicacoes?indicador=${u.id}`}>Indicações</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        ) : null}
      </div>
    </div>
  );
}
