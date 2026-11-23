"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Crown,
  Flame,
  Medal,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  getMeuPerfilGamificacao,
  listarConquistas,
  listarNiveis,
  listarRanking,
} from "@/features/recompensas/services/gamificacao";
import type {
  Conquista,
  ConquistaDesbloqueada,
  MetaParticipante,
  Nivel,
  PerfilGamificacao,
  RankingEntry,
} from "@/features/recompensas/types";

const ICON_MAP: Record<string, typeof Trophy> = {
  star: Star,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  award: Award,
  target: Target,
};

function iconFor(name: string) {
  return ICON_MAP[name] ?? Trophy;
}

export function RewardsEngine() {
  const [perfil, setPerfil] = useState<PerfilGamificacao | null>(null);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [conquistas, setConquistas] = useState<Conquista[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const [p, n, c, r] = await Promise.all([
        getMeuPerfilGamificacao(),
        listarNiveis(),
        listarConquistas(),
        listarRanking(10),
      ]);
      if (!active) return;
      setPerfil(p);
      setNiveis(n);
      setConquistas(c);
      setRanking(r);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-amber-950">
        <p className="text-sm font-semibold">Não foi possível carregar o perfil de recompensas.</p>
        <p className="mt-1 text-xs">Tente novamente mais tarde.</p>
      </div>
    );
  }

  const pontos = perfil.pontos ?? 0;
  const nivel = perfil.nivel;
  const proximo = perfil.proximo_nivel;
  const progressoNivel = proximo
    ? Math.min(100, Math.round(((pontos - (nivel?.pontos_minimos ?? 0)) / (proximo.pontos_minimos - (nivel?.pontos_minimos ?? 0))) * 100))
    : 100;

  const conquistasDesbloqueadas = new Set(perfil.conquistas.map((c) => c.id));

  return (
    <div className="space-y-6 animate-rise">
      {/* Saldo + nível */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">Meu perfil de recompensas</p>
            <p className="mt-1 font-heading text-3xl font-bold text-ink">{pontos} <span className="text-base font-medium text-muted-foreground">pontos</span></p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ranking: #{perfil.ranking} entre participantes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {nivel ? (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold ring-1 ring-inset"
                style={{ backgroundColor: nivel.cor + "20", color: nivel.cor, borderColor: nivel.cor + "40" }}
              >
                {(() => { const I = iconFor(nivel.icone); return <I className="size-4" aria-hidden="true" />; })()}
                {nivel.nome}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-2 text-sm font-bold text-muted-foreground ring-1 ring-inset ring-border">
                Sem nível
              </span>
            )}
          </div>
        </div>
        {proximo ? (
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progresso para {proximo.nome}</span>
              <span className="font-semibold text-ink">{progressoNivel}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-aqua transition-all duration-500"
                style={{ width: `${progressoNivel}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Faltam {Math.max(0, proximo.pontos_minimos - pontos)} pontos para o próximo nível.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">Você atingiu o nível máximo!</p>
        )}
      </section>

      {/* Metas */}
      {perfil.metas.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-heading text-base font-bold text-ink">Minhas metas</h2>
          <p className="text-[11px] text-muted-foreground">Acompanhe seu progresso.</p>
          <ul className="mt-4 space-y-3">
            {perfil.metas.map((meta) => {
              const pct = meta.meta_valor > 0 ? Math.min(100, Math.round((meta.progresso / meta.meta_valor) * 100)) : 0;
              return (
                <li key={meta.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-ink">{meta.titulo}</p>
                    <span className="text-[10px] font-bold text-brand-700">{pct}%</span>
                  </div>
                  {meta.descricao ? <p className="mt-0.5 text-[10px] text-muted-foreground">{meta.descricao}</p> : null}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {meta.progresso} / {meta.meta_valor}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Conquistas */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-base font-bold text-ink">Conquistas</h2>
        <p className="text-[11px] text-muted-foreground">Desbloqueie conquistas ao atingir metas.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {conquistas.map((c) => {
            const unlocked = conquistasDesbloqueadas.has(c.id);
            const unlockedData = perfil.conquistas.find((u) => u.id === c.id);
            const Icon = iconFor(c.icone);
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 transition-all ${
                  unlocked
                    ? "border-brand-200 bg-brand-50 shadow-soft"
                    : "border-border bg-background opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ${
                      unlocked ? "bg-brand-500 text-ink ring-brand-400" : "bg-muted text-muted-foreground ring-border"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">{c.nome}</p>
                    {c.descricao ? <p className="mt-0.5 text-[10px] text-muted-foreground">{c.descricao}</p> : null}
                    {unlocked && unlockedData ? (
                      <p className="mt-1 text-[9px] font-semibold text-brand-700">
                        Desbloqueada em {new Date(unlockedData.desbloqueada_em).toLocaleDateString("pt-BR")}
                      </p>
                    ) : (
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        +{c.pontos_recompensa} pontos
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {conquistas.length === 0 ? (
            <p className="col-span-full text-center text-xs text-muted-foreground">Nenhuma conquista cadastrada.</p>
          ) : null}
        </div>
      </section>

      {/* Ranking */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-base font-bold text-ink">Ranking de participantes</h2>
        <p className="text-[11px] text-muted-foreground">Top 10 por pontos.</p>
        {ranking.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">Nenhum participante no ranking ainda.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {ranking.map((entry, index) => (
              <li key={entry.participante_id} className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-background">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-bold text-brand-300">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{entry.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.nivel ?? "Sem nível"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-800 ring-1 ring-brand-200 ring-inset">
                  {entry.pontos} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Níveis */}
      {niveis.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-heading text-base font-bold text-ink">Níveis</h2>
          <p className="text-[11px] text-muted-foreground">Progressão por pontos.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {niveis.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset"
                style={{ backgroundColor: n.cor + "15", color: n.cor, borderColor: n.cor + "40" }}
              >
                {n.nome} · {n.pontos_minimos} pts
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
