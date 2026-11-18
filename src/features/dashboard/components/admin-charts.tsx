"use client";

import {
 Area,
 AreaChart,
 CartesianGrid,
 Cell,
 Pie,
 PieChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatNumberBR } from "@/shared/lib/format";
import { REFERRAL_STATUS_OPTIONS } from "@/features/indicacoes/services/status";
import type { AdminMonthlyPoint } from "@/features/dashboard/services/types";

type MonthlyChartProps = {
 data: AdminMonthlyPoint[];
};

export function MonthlyReferralsChart({ data }: MonthlyChartProps) {
 const chartData = data.map((point) => ({
 ...point,
 label: format(parseISO(`${point.mes}-01`), "MMM", { locale: ptBR }),
 labelFull: format(parseISO(`${point.mes}-01`), "MMMM 'de' yyyy", {
 locale: ptBR,
 }),
 }));

 return (
 <div className="h-[260px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart
 data={chartData}
 margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
 >
 <defs>
 <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#D2DD3A" stopOpacity={0.55} />
 <stop offset="100%" stopColor="#D2DD3A" stopOpacity={0.02} />
 </linearGradient>
 <linearGradient id="installedGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#31393F" stopOpacity={0.35} />
 <stop offset="100%" stopColor="#31393F" stopOpacity={0.02} />
 </linearGradient>
 </defs>
 <CartesianGrid
 strokeDasharray="4 4"
 stroke="#e2e6da"
 vertical={false}
 />
 <XAxis
 dataKey="label"
 tickLine={false}
 axisLine={false}
 tick={{ fontSize: 11, fill: "#5c6a66" }}
 dy={6}
 />
 <YAxis
 allowDecimals={false}
 tickLine={false}
 axisLine={false}
 tick={{ fontSize: 11, fill: "#5c6a66" }}
 width={40}
 />
 <Tooltip
 cursor={{ stroke: "#D2DD3A", strokeWidth: 1 }}
 contentStyle={{
 borderRadius: 12,
 border: "1px solid #e2e6da",
 boxShadow: "0 18px 40px -24px rgba(38,55,64,0.35)",
 fontSize: 12,
 padding: "10px 12px",
 }}
 labelFormatter={(_, payload) =>
 payload?.[0]?.payload?.labelFull ?? ""
 }
 formatter={(value, name) => [
 formatNumberBR(Number(value ?? 0)),
 name === "total" ? "Indicações" : "Instaladas",
 ]}
 />
 <Area
 type="monotone"
 dataKey="total"
 name="total"
 stroke="#9cb527"
 strokeWidth={2.5}
 fill="url(#totalGradient)"
 activeDot={{ r: 4, fill: "#D2DD3A", stroke: "#31393F", strokeWidth: 1.5 }}
 />
 <Area
 type="monotone"
 dataKey="instalados"
 name="instalados"
 stroke="#31393F"
 strokeWidth={2}
 strokeDasharray="5 4"
 fill="url(#installedGradient)"
 activeDot={{ r: 3.5, fill: "#31393F" }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 );
}

export function StatusDonutChart({
 porStatus,
}: {
 porStatus: Record<string, number>;
}) {
 const data = REFERRAL_STATUS_OPTIONS.map((status) => ({
 name: status.label,
 shortLabel: status.shortLabel,
 value: Number(porStatus[status.value] ?? 0),
 color: status.chartColor,
 })).filter((item) => item.value > 0);

 const total = data.reduce((sum, item) => sum + item.value, 0);

 if (total === 0) {
 return (
 <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-border bg-background">
 <p className="px-5 text-center text-xs text-muted-foreground">
 Nenhuma indicação registrada ainda. O gráfico será exibido quando a
 primeira indicação chegar.
 </p>
 </div>
 );
 }

 return (
 <div className="grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center">
 <div className="relative h-[190px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data}
 dataKey="value"
 nameKey="shortLabel"
 innerRadius={52}
 outerRadius={82}
 paddingAngle={2}
 strokeWidth={0}
 >
 {data.map((entry) => (
 <Cell key={entry.name} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{
 borderRadius: 12,
 border: "1px solid #e2e6da",
 boxShadow: "0 18px 40px -24px rgba(38,55,64,0.35)",
 fontSize: 12,
 padding: "10px 12px",
 }}
 formatter={(value, name) => [
 `${formatNumberBR(Number(value ?? 0))} (${(
 (Number(value ?? 0) / total) *
 100
 ).toFixed(0)}%)`,
 String(name),
 ]}
 />
 </PieChart>
 </ResponsiveContainer>
 <div className="pointer-events-none absolute inset-0 grid place-items-center">
 <div className="text-center">
 <p className="font-heading text-2xl font-bold text-ink">
 {formatNumberBR(total)}
 </p>
 <p className="text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
 Indicações
 </p>
 </div>
 </div>
 </div>

 <ul className="space-y-1.5">
 {data.map((item) => (
 <li
 key={item.name}
 className="flex items-center justify-between gap-2 text-[11px]"
 >
 <span className="flex min-w-0 items-center gap-2">
 <span
 aria-hidden="true"
 className="size-2 shrink-0 rounded-full"
 style={{ backgroundColor: item.color }}
 />
 <span className="truncate text-muted-foreground">{item.name}</span>
 </span>
 <span className="shrink-0 font-semibold text-ink">
 {formatNumberBR(item.value)}
 </span>
 </li>
 ))}
 </ul>
 </div>
 );
}
