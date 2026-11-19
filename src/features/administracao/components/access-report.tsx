"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import { formatNumberBR } from "@/shared/lib/format";

type AccessStats = {
  total_views: number;
  views_hoje: number;
  views_7dias: number;
  views_30dias: number;
  top_paginas: Array<{ path: string; total: number }>;
  acessos_por_dia: Array<{ dia: string; total: number }>;
};

export function AccessReport() {
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc("get_access_stats");
        setStats(data as AccessStats);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">Carregando relatório de acessos...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o relatório.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Total de acessos
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-ink">
          {formatNumberBR(stats.total_views)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Hoje
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-ink">
          {formatNumberBR(stats.views_hoje)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Últimos 7 dias
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-ink">
          {formatNumberBR(stats.views_7dias)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
        <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Últimos 30 dias
        </p>
        <p className="mt-2 font-heading text-2xl font-bold text-ink">
          {formatNumberBR(stats.views_30dias)}
        </p>
      </div>
      {stats.top_paginas.length > 0 ? (
        <div className="col-span-full rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
            Páginas mais acessadas
          </p>
          <ul className="mt-3 space-y-1.5">
            {stats.top_paginas.map((p) => (
              <li key={p.path} className="flex items-center justify-between text-sm">
                <span className="truncate text-ink">{p.path}</span>
                <span className="shrink-0 font-semibold text-brand-600">{formatNumberBR(p.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
