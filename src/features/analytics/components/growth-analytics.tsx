"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  Lightbulb,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { StatCard } from "@/shared/layout/stat-card";
import { MonthlyReferralsChart } from "@/features/dashboard/components/admin-charts";
import type { AdminStats } from "@/features/dashboard/services/types";

type MetricKey =
  | "total_indicacoes"
  | "contratos_aprovados"
  | "instalados"
  | "taxa_conversao"
  | "taxa_instalacao"
  | "recompensas_pendentes"
  | "recompensas_disponiveis"
  | "recompensas_pagas"
  | "custo_por_conversao"
  | "ticket_medio_recompensa";

const METRIC_LABELS: Record<MetricKey, string> = {
  total_indicacoes: "Total de indicações",
  contratos_aprovados: "Contratos aprovados",
  instalados: "Instalações concluídas",
  taxa_conversao: "Taxa de conversão (%)",
  taxa_instalacao: "Taxa de instalação (%)",
  recompensas_pendentes: "Recompensas pendentes",
  recompensas_disponiveis: "Recompensas disponíveis",
  recompensas_pagas: "Recompensas pagas",
  custo_por_conversao: "Custo por conversão (R$)",
  ticket_medio_recompensa: "Ticket médio de recompensa (R$)",
};

export function GrowthAnalytics({ stats }: { stats: AdminStats | null }) {
  const [selected, setSelected] = useState<Set<MetricKey>>(
    new Set<MetricKey>([
      "total_indicacoes",
      "contratos_aprovados",
      "instalados",
      "taxa_conversao",
      "recompensas_pagas",
    ]),
  );

  const derived = useMemo(() => {
    if (!stats) return null;
    const total = stats.total_indicacoes || 0;
    const contratos = stats.contratos_aprovados || 0;
    const instalados = stats.instalados || 0;
    const pagas = stats.recompensas_pagas || 0;
    const valorPago = stats.valor_recompensas_pagas_centavos || 0;
    return {
      taxaConversao: total > 0 ? (contratos / total) * 100 : 0,
      taxaInstalacao: total > 0 ? (instalados / total) * 100 : 0,
      custoPorConversao: instalados > 0 ? valorPago / 100 / instalados : 0,
      ticketMedio: pagas > 0 ? valorPago / 100 / pagas : 0,
    };
  }, [stats]);

  const insights = useMemo(() => {
    if (!stats || !derived) return [];
    const out: { tipo: "positivo" | "alerta" | "info"; texto: string }[] = [];
    const total = stats.total_indicacoes;
    const instalados = stats.instalados;
    const contratos = stats.contratos_aprovados;
    if (total === 0) {
      out.push({ tipo: "info", texto: "Ainda não há indicações registradas. Comece cadastrando a primeira indicação." });
      return out;
    }
    if (derived.taxaConversao >= 50) {
      out.push({ tipo: "positivo", texto: `Taxa de conversão de ${derived.taxaConversao.toFixed(1)}% — acima de 50%. Bom desempenho.` });
    } else {
      out.push({ tipo: "alerta", texto: `Taxa de conversão de ${derived.taxaConversao.toFixed(1)}%. Considere revisar a análise e o contato com os indicados.` });
    }
    if (derived.taxaInstalacao < 30 && total >= 5) {
      out.push({ tipo: "alerta", texto: `Apenas ${derived.taxaInstalacao.toFixed(1)}% das indicações resultaram em instalação. Verifique gargalos na etapa de contrato/instalação.` });
    }
    if (stats.recompensas_pendentes > 0) {
      out.push({ tipo: "info", texto: `${stats.recompensas_pendentes} recompensa(s) pendente(s) de liberação. Priorize a validação.` });
    }
    if (stats.recompensas_disponiveis > 0) {
      out.push({ tipo: "info", texto: `${stats.recompensas_disponiveis} recompensa(s) disponível(is) para pagamento.` });
    }
    const top = stats.top_indicadores?.[0];
    if (top && top.total > 0) {
      out.push({ tipo: "positivo", texto: `Top indicador: ${top.nome} (${top.total} indicações, ${top.instalados} instaladas).` });
    }
    return out;
  }, [stats, derived]);

  const metricValue = (key: MetricKey): string => {
    if (!stats || !derived) return "—";
    switch (key) {
      case "total_indicacoes": return String(stats.total_indicacoes);
      case "contratos_aprovados": return String(stats.contratos_aprovados);
      case "instalados": return String(stats.instalados);
      case "taxa_conversao": return `${derived.taxaConversao.toFixed(1)}%`;
      case "taxa_instalacao": return `${derived.taxaInstalacao.toFixed(1)}%`;
      case "recompensas_pendentes": return String(stats.recompensas_pendentes);
      case "recompensas_disponiveis": return String(stats.recompensas_disponiveis);
      case "recompensas_pagas": return String(stats.recompensas_pagas);
      case "custo_por_conversao": return derived.custoPorConversao.toFixed(2);
      case "ticket_medio_recompensa": return derived.ticketMedio.toFixed(2);
    }
  };

  const handleExportCsv = () => {
    if (!stats) { toast.error("Sem dados para exportar."); return; }
    const headers = ["Indicador", "Valor"];
    const rows = Array.from(selected).map((k) => [METRIC_LABELS[k], metricValue(k)]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação CSV concluída");
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleMetric = (key: MetricKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (!stats) {
    return (
      <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 text-amber-950">
        <p className="text-sm font-semibold">Indicadores indisponíveis</p>
        <p className="mt-1 text-xs">Não foi possível carregar os dados. Verifique a conexão com o banco.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs de desempenho */}
      <section aria-label="Indicadores de desempenho" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Taxa de conversão" value={`${derived!.taxaConversao.toFixed(1)}%`} description="Contratos aprovados / total de indicações." icon={TrendingUp} tone="emerald" />
        <StatCard label="Taxa de instalação" value={`${derived!.taxaInstalacao.toFixed(1)}%`} description="Instalações concluídas / total de indicações." icon={TrendingUp} tone="cyan" />
        <StatCard label="Custo por conversão" value={derived!.custoPorConversao > 0 ? `R$ ${derived!.custoPorConversao.toFixed(2)}` : "—"} description="Recompensas pagas por indicação instalada." icon={TrendingDown} tone="violet" />
        <StatCard label="Ticket médio de recompensa" value={derived!.ticketMedio > 0 ? `R$ ${derived!.ticketMedio.toFixed(2)}` : "—"} description="Valor médio por recompensa paga." icon={BarChart3} tone="amber" />
      </section>

      {/* Insights */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Lightbulb className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-ink">Insights e recomendações</h2>
            <p className="text-[11px] text-muted-foreground">Análise baseada em dados reais do período.</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {insights.map((ins, i) => (
            <li
              key={i}
              className={`rounded-xl border px-3 py-2 text-xs ${
                ins.tipo === "positivo"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : ins.tipo === "alerta"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-border bg-background text-foreground"
              }`}
            >
              {ins.texto}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-muted-foreground">
          As recomendações são sugestões baseadas nos dados. Ações administrativas exigem confirmação humana.
        </p>
      </section>

      {/* Evolução mensal (reuso do chart) */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-heading text-base font-bold text-ink">Evolução mensal</h2>
        <p className="text-[11px] text-muted-foreground">Indicações recebidas e instalações concluídas nos últimos 6 meses.</p>
        <div className="mt-4">
          <MonthlyReferralsChart data={stats.por_mes ?? []} />
        </div>
      </section>

      {/* Construtor de relatórios */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-ink text-brand-300">
            <FileText className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-ink">Construtor de relatórios</h2>
            <p className="text-[11px] text-muted-foreground">Selecione os indicadores e exporte em CSV ou imprima em PDF.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs cursor-pointer hover:bg-muted/40">
              <Checkbox
                checked={selected.has(key)}
                onCheckedChange={() => toggleMetric(key)}
              />
              {METRIC_LABELS[key]}
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="h-9" onClick={handleExportCsv} disabled={selected.size === 0}>
            <Download className="size-3.5" aria-hidden="true" />
            Exportar CSV
          </Button>
          <Button size="sm" variant="outline" className="h-9" onClick={handlePrint}>
            <Printer className="size-3.5" aria-hidden="true" />
            Imprimir / PDF
          </Button>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Os valores são derivados de dados reais do banco. A origem e o período estão indicados no relatório.
        </p>
      </section>
    </div>
  );
}
