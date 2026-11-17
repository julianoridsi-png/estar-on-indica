"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Search,
  Send,
  Users,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { PixRevealButton, PixStatusHint } from "@/features/administracao/components/pix-reveal-dialog";
import { formatDateBR, formatNumberBR } from "@/shared/lib/format";
import { getInitials } from "@/features/autenticacao/services/queries";
import type { AdminIndicator } from "@/features/administracao/services/types";

type PixFilter = "todos" | "com" | "pendente";

export function IndicatorsTable({
  indicators,
  isAdmin,
  initialPixFilter = "todos",
}: {
  indicators: AdminIndicator[];
  isAdmin: boolean;
  initialPixFilter?: PixFilter;
}) {
  const [search, setSearch] = useState("");
  const [pixFilter, setPixFilter] = useState<PixFilter>(initialPixFilter);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return indicators.filter((indicator) => {
      if (
        isAdmin &&
        pixFilter === "com" &&
        indicator.pix_configurado !== true
      ) {
        return false;
      }

      if (
        isAdmin &&
        pixFilter === "pendente" &&
        indicator.pix_configurado !== false
      ) {
        return false;
      }

      if (!term) return true;

      return (
        indicator.nome_completo.toLowerCase().includes(term) ||
        indicator.email.toLowerCase().includes(term) ||
        (indicator.cidade ?? "").toLowerCase().includes(term) ||
        (indicator.estado ?? "").toLowerCase().includes(term)
      );
    });
  }, [indicators, isAdmin, pixFilter, search]);

  const semPix = indicators.filter(
    (indicator) => indicator.pix_configurado === false,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou cidade"
            className="pl-9"
            aria-label="Buscar indicador"
          />
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: "todos", label: "Todos" },
                { value: "com", label: "Com PIX" },
                { value: "pendente", label: "Sem PIX" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPixFilter(option.value)}
                aria-pressed={pixFilter === option.value}
                className={
                  pixFilter === option.value
                    ? "rounded-full bg-ink px-3 py-1.5 text-[10px] font-bold text-white"
                    : "rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-brand-50 hover:text-ink"
                }
              >
                {option.label}
                {option.value === "pendente" && semPix > 0 ? (
                  <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-[9px] font-bold text-amber-950">
                    {semPix}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {filtered.length}{" "}
          {filtered.length === 1 ? "indicador encontrado" : "indicadores encontrados"}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-800 ring-1 ring-brand-200 ring-inset">
          <Users className="size-3" aria-hidden="true" />
          Base de indicadores
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Users className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-base font-bold text-ink">
            Nenhum indicador encontrado
          </h2>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
            Ajuste a busca ou o filtro de PIX para localizar o indicador
            desejado.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearch("");
              setPixFilter("todos");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="bg-background text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Indicador</th>
                  <th className="px-4 py-3 font-bold">Local</th>
                  <th className="px-4 py-3 font-bold">Indicações</th>
                  {isAdmin ? (
                    <th className="px-4 py-3 font-bold">Recompensas</th>
                  ) : null}
                  {isAdmin ? (
                    <th className="px-4 py-3 font-bold">Chave PIX</th>
                  ) : null}
                  <th className="px-4 py-3 font-bold">Desde</th>
                  <th className="px-4 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((indicator) => (
                  <tr key={indicator.id} className="hover:bg-background/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-brand-300">
                          {getInitials(indicator.nome_completo)}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[190px] truncate font-semibold text-ink">
                            {indicator.nome_completo}
                          </p>
                          <p className="max-w-[190px] truncate text-[10px] text-muted-foreground">
                            {indicator.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">
                      {indicator.cidade && indicator.estado
                        ? `${indicator.cidade} / ${indicator.estado}`
                        : "Não informado"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800 ring-1 ring-brand-200 ring-inset">
                          <Send className="size-2.5" aria-hidden="true" />
                          {formatNumberBR(indicator.total_indicacoes)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CheckCircle2
                            className="size-2.5 text-emerald-600"
                            aria-hidden="true"
                          />
                          {formatNumberBR(indicator.instaladas)}
                        </span>
                      </div>
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-[10px]">
                          <p className="font-semibold text-ink">
                            {formatNumberBR(indicator.recompensas_pagas)} pagas
                          </p>
                          <p className="text-muted-foreground">
                            {formatNumberBR(
                              indicator.recompensas_pendentes,
                            )}{" "}
                            em aberto
                          </p>
                        </div>
                      </td>
                    ) : null}
                    {isAdmin ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <PixStatusHint
                            configurado={indicator.pix_configurado}
                            mascarada={indicator.pix_mascarada}
                          />
                          {indicator.pix_configurado ? (
                            <PixRevealButton
                              profileId={indicator.id}
                              nome={indicator.nome_completo}
                              tipo={indicator.pix_tipo}
                              chaveMascarada={indicator.pix_mascarada}
                              size="sm"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-700">
                              <CircleAlert
                                className="size-2.5"
                                aria-hidden="true"
                              />
                              Aguardando cadastro
                            </span>
                          )}
                        </div>
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">
                      {formatDateBR(indicator.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/admin/indicacoes?indicador=${indicator.id}`}
                          >
                            Indicações
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border bg-background px-4 py-3">
            <p className="text-[10px] text-muted-foreground">
              Exibindo até 500 indicadores. A chave PIX completa só pode ser
              consultada por administradores, com registro de auditoria.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
