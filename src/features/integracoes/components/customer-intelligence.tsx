"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Mail,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/services/supabase/client";
import type { AdminIndicator } from "@/features/administracao/services/types";

type Segment = "todos" | "novos" | "ativos" | "inativos" | "alto_desempenho" | "pendentes";

const SEGMENT_LABELS: Record<Segment, string> = {
  todos: "Todos",
  novos: "Novos",
  ativos: "Ativos",
  inativos: "Inativos",
  alto_desempenho: "Alto desempenho",
  pendentes: "Pendentes",
};

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function segmentOf(ind: AdminIndicator): Segment[] {
  const segs: Segment[] = [];
  const days = daysSince(ind.created_at);
  if (days <= 30) segs.push("novos");
  if (ind.total_indicacoes > 0 && days <= 90) segs.push("ativos");
  if (ind.total_indicacoes === 0 && days > 90) segs.push("inativos");
  if (ind.total_indicacoes >= 5 || ind.instaladas >= 2) segs.push("alto_desempenho");
  if (ind.recompensas_pendentes > 0 || ind.total_indicacoes > ind.instaladas + ind.recompensas_pagas) segs.push("pendentes");
  if (segs.length === 0) segs.push("ativos");
  return segs;
}

export function CustomerIntelligence() {
  const [indicators, setIndicators] = useState<AdminIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<Segment>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_listar_indicadores");
      if (error) {
        toast.error("Não foi possível carregar os participantes", { description: error.message });
        setIndicators([]);
        return;
      }
      setIndicators((data ?? []) as AdminIndicator[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return indicators.filter((ind) => {
      if (term) {
        const match =
          ind.nome_completo.toLowerCase().includes(term) ||
          ind.email.toLowerCase().includes(term) ||
          (ind.cidade ?? "").toLowerCase().includes(term);
        if (!match) return false;
      }
      if (segment !== "todos") {
        if (!segmentOf(ind).includes(segment)) return false;
      }
      return true;
    });
  }, [indicators, search, segment]);

  const segmentCounts = useMemo(() => {
    const counts: Record<Segment, number> = {
      todos: indicators.length,
      novos: 0,
      ativos: 0,
      inativos: 0,
      alto_desempenho: 0,
      pendentes: 0,
    };
    for (const ind of indicators) {
      for (const s of segmentOf(ind)) {
        counts[s]++;
      }
    }
    return counts;
  }, [indicators]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cidade"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SEGMENT_LABELS) as Segment[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSegment(s)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                segment === s
                  ? "bg-ink text-white"
                  : "bg-muted text-muted-foreground hover:bg-brand-50 hover:text-ink"
              }`}
            >
              {SEGMENT_LABELS[s]} ({segmentCounts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de participantes */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <Users className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Nenhum participante encontrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Ajuste os filtros ou o termo de busca.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <ul className="divide-y divide-border">
            {filtered.map((ind) => {
              const segs = segmentOf(ind);
              const isOpen = expanded === ind.id;
              return (
                <li key={ind.id}>
                  <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">
                        {ind.nome_completo.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{ind.nome_completo}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {ind.email} · {ind.cidade && ind.estado ? `${ind.cidade}/${ind.estado}` : "Sem cidade"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {segs.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                            s === "novos" ? "bg-sky-50 text-sky-700 ring-sky-200" :
                            s === "ativos" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
                            s === "inativos" ? "bg-slate-100 text-slate-700 ring-slate-300" :
                            s === "alto_desempenho" ? "bg-brand-50 text-brand-700 ring-brand-200" :
                            "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                        >
                          {SEGMENT_LABELS[s]}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground">
                        {ind.total_indicacoes} ind. · {ind.instaladas} inst.
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : ind.id)}
                        className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                        aria-label={isOpen ? "Recolher detalhes" : "Ver detalhes"}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-border bg-background/40 px-5 py-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-3">
                          <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Indicações</p>
                          <p className="mt-1 font-heading text-lg font-bold text-ink">{ind.total_indicacoes}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-3">
                          <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Instaladas</p>
                          <p className="mt-1 font-heading text-lg font-bold text-ink">{ind.instaladas}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-3">
                          <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Recompensas pendentes</p>
                          <p className="mt-1 font-heading text-lg font-bold text-ink">{ind.recompensas_pendentes}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-3">
                          <p className="text-[9px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Recompensas pagas</p>
                          <p className="mt-1 font-heading text-lg font-bold text-ink">{ind.recompensas_pagas}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" aria-hidden="true" />
                          Membro desde {new Date(ind.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3.5" aria-hidden="true" />
                          {ind.email}
                        </span>
                        {ind.pix_configurado ? (
                          <span className="flex items-center gap-1.5 text-emerald-700">
                            <ShieldCheck className="size-3.5" aria-hidden="true" />
                            PIX cadastrado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <ShieldCheck className="size-3.5" aria-hidden="true" />
                            Sem PIX
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Segmentação baseada em critérios transparentes: novos (cadastro ≤ 30 dias), ativos (indicações nos últimos 90 dias), inativos (sem indicações há mais de 90 dias), alto desempenho (≥ 5 indicações ou ≥ 2 instalações), pendentes (indicações ou recompensas em aberto).
      </p>
    </div>
  );
}
