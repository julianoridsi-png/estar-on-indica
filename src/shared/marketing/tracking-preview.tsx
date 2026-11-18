import {
 BadgeCheck,
 Check,
 Clock3,
 Gift,
 ShieldCheck,
 UserRound,
} from "lucide-react";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { TRACKING_STEPS } from "@/features/indicacoes/services/status";

export function TrackingPreview() {
 const exampleStage = 3;

 return (
 <div className="relative mx-auto max-w-[430px]">
 <div
 aria-hidden="true"
 className="absolute -top-10 -right-8 size-44 rounded-full bg-aqua/20 blur-2xl"
 />
 <div
 aria-hidden="true"
 className="absolute -bottom-12 -left-8 size-52 rounded-full bg-brand-500/20 blur-3xl"
 />

 <div className="relative rounded-[26px] border border-white/70 bg-card p-5 shadow-lift sm:p-6">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-[10px] font-bold tracking-[0.2em] text-brand-600 uppercase">
 Acompanhamento
 </p>
 <h3 className="mt-1 font-heading text-base font-bold text-ink">
 Sua indicação
 </h3>
 </div>
 <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold tracking-wide text-amber-700 uppercase ring-1 ring-amber-200 ring-inset">
 Exemplo ilustrativo
 </span>
 </div>

 <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
 <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
 <UserRound className="size-5" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-ink">Pessoa indicada</p>
 <p className="text-[11px] text-muted-foreground">
 Indicação de exemplo • sem dados reais
 </p>
 </div>
 <StatusBadge status="contrato_aprovado" showDot={false} />
 </div>

 <div className="mt-4">
 <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
 <span>Progresso do acompanhamento</span>
 <span className="text-brand-700">
 {exampleStage + 1} de {TRACKING_STEPS.length}
 </span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
 <div
 className="h-full rounded-full bg-gradient-to-r from-brand-500 to-aqua"
 style={{
 width: `${((exampleStage + 1) / TRACKING_STEPS.length) * 100}%`,
 }}
 />
 </div>
 </div>

 <ol className="mt-5 space-y-0.5">
 {TRACKING_STEPS.map((step, index) => {
 const isDone = index < exampleStage;
 const isCurrent = index === exampleStage;

 return (
 <li key={step.label} className="flex gap-3">
 <div className="flex flex-col items-center">
 <span
 className={
 isDone
 ? "grid size-5 place-items-center rounded-full bg-emerald-500 text-white"
 : isCurrent
 ? "grid size-5 place-items-center rounded-full bg-brand-500 text-ink ring-4 ring-brand-100"
 : "grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground"
 }
 >
 {isDone ? (
 <Check className="size-3" aria-hidden="true" />
 ) : (
 <span
 className={
 isCurrent
 ? "size-1.5 rounded-full bg-card"
 : "size-1.5 rounded-full bg-border"
 }
 />
 )}
 </span>
 {index < TRACKING_STEPS.length - 1 ? (
 <span
 className={
 isDone
 ? "my-0.5 h-5 w-px bg-emerald-300"
 : "my-0.5 h-5 w-px bg-border"
 }
 />
 ) : null}
 </div>
 <div className="flex flex-1 items-start justify-between gap-2 pb-0.5">
 <span
 className={
 isCurrent
 ? "text-xs font-semibold text-ink"
 : isDone
 ? "text-xs font-medium text-foreground/80"
 : "text-xs text-muted-foreground"
 }
 >
 {step.label}
 </span>
 <span className="text-[9px] font-medium text-muted-foreground/80">
 {isDone ? "Concluído" : isCurrent ? "Em andamento" : "Aguardando"}
 </span>
 </div>
 </li>
 );
 })}
 </ol>

 <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
 <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
 <Clock3 className="size-3.5" aria-hidden="true" />
 Atualização automática de status
 </span>
 <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
 <ShieldCheck className="size-3.5" aria-hidden="true" />
 Ambiente seguro
 </span>
 </div>
 </div>

 <div className="animate-float absolute -top-6 -left-4 hidden items-center gap-2.5 rounded-2xl border border-border bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur sm:flex">
 <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
 <BadgeCheck className="size-5" aria-hidden="true" />
 </span>
 <div>
 <p className="text-[10px] font-bold text-ink">Transparência total</p>
 <p className="text-[9px] text-muted-foreground">Cada etapa registrada</p>
 </div>
 </div>

 <div className="animate-float-slow absolute -right-4 -bottom-7 hidden items-center gap-2.5 rounded-2xl border border-border bg-white/95 px-3.5 py-2.5 shadow-soft backdrop-blur sm:flex">
 <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
 <Gift className="size-5" aria-hidden="true" />
 </span>
 <div>
 <p className="text-[10px] font-bold text-ink">Recompensas</p>
 <p className="text-[9px] text-muted-foreground">
 Conforme a campanha vigente
 </p>
 </div>
 </div>
 </div>
 );
}
