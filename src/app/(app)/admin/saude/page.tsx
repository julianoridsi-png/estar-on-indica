import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { isSupabaseConfigured } from "@/services/supabase/config";
import { Activity, AlertTriangle, CheckCircle2, Database, RefreshCw, Server, ShieldCheck, Wifi, XCircle } from "lucide-react";

export const metadata: Metadata = {
 title: "Saúde do sistema",
 robots: { index: false, follow: false },
};

export default async function SaudePage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/saude");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario !== "admin") redirect("/admin");

 const configured = isSupabaseConfigured();
 let supabaseOk = false;
 let auditCount = 0;
 let integrationsCount = 0;
 let flowsCount = 0;
 let alertsCount = 0;
 let recentErrors: { id: string; tabela: string; acao: string; created_at: string }[] = [];

 if (configured) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  supabaseOk = !error;

  const { count: ac } = await supabase.from("audit_logs").select("id", { count: "exact", head: true });
  auditCount = ac ?? 0;

  const { count: ic } = await supabase.from("integracoes").select("id", { count: "exact", head: true });
  integrationsCount = ic ?? 0;

  const { count: fc } = await supabase.from("automation_flows").select("id", { count: "exact", head: true });
  flowsCount = fc ?? 0;

  const { count: alc } = await supabase.from("followup_alerts").select("id", { count: "exact", head: true }).eq("resolvido", false);
  alertsCount = alc ?? 0;

  const { data: errs } = await supabase
   .from("audit_logs")
   .select("id, tabela, acao, created_at")
   .order("created_at", { ascending: false })
   .limit(5);
  recentErrors = (errs ?? []) as typeof recentErrors;
 }

 const checks = [
  { label: "Supabase configurado", ok: configured, detail: configured ? "Credenciais presentes" : "Variáveis ausentes" },
  { label: "Conexão com Supabase", ok: supabaseOk, detail: supabaseOk ? "Conectado" : "Falha na conexão" },
  { label: "Tabelas de integrações", ok: true, detail: `${integrationsCount} integração(ões) cadastrada(s)` },
  { label: "Tabelas de automações", ok: true, detail: `${flowsCount} fluxo(s) cadastrado(s)` },
  { label: "Alertas de follow-up", ok: alertsCount === 0, detail: `${alertsCount} alerta(s) pendente(s)` },
  { label: "Trilha de auditoria", ok: true, detail: `${auditCount} registro(s)` },
 ];

 const allOk = checks.every((c) => c.ok);

 return (
  <div className="space-y-6 animate-rise">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
     <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
      <Activity className="size-3.5" aria-hidden="true" />
      Central de Saúde
     </p>
     <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
      Saúde do sistema
     </h1>
     <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
      Status geral da plataforma e verificações automáticas.
     </p>
    </div>
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${allOk ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
     {allOk ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <AlertTriangle className="size-4" aria-hidden="true" />}
     {allOk ? "Sistema operacional" : "Atenção necessária"}
    </span>
   </div>

   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {checks.map((check) => (
     <div key={check.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
       <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${check.ok ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-amber-50 text-amber-600 ring-amber-200"}`}>
        {check.ok ? <CheckCircle2 className="size-4.5" aria-hidden="true" /> : <AlertTriangle className="size-4.5" aria-hidden="true" />}
       </span>
       <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{check.label}</p>
        <p className="text-[10px] text-muted-foreground">{check.detail}</p>
       </div>
      </div>
     </div>
    ))}
   </div>

   <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <h2 className="font-heading text-base font-bold text-ink">Eventos recentes (auditoria)</h2>
    <p className="text-[11px] text-muted-foreground">Últimos 5 registros da trilha de auditoria.</p>
    {recentErrors.length === 0 ? (
     <p className="mt-4 text-xs text-muted-foreground">Nenhum evento registrado.</p>
    ) : (
     <ul className="mt-4 space-y-2">
      {recentErrors.map((e) => (
       <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-xs">
        <span className="flex items-center gap-2 min-w-0">
         <Activity className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
         <span className="truncate font-medium text-ink">{e.tabela}</span>
         <span className="text-muted-foreground">— {e.acao}</span>
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
         {new Date(e.created_at).toLocaleString("pt-BR")}
        </span>
       </li>
      ))}
     </ul>
    )}
   </div>

   <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <h2 className="font-heading text-base font-bold text-ink">Recomendações</h2>
    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500" />Execute as migrations 0016–0023 no Supabase antes de usar as novas funcionalidades.</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500" />Configure NEXT_PUBLIC_SITE_URL no Cloudflare Workers para produção.</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500" />Cadastre as Redirect URLs no Supabase Dashboard para recuperação de senha.</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-brand-500" />Para gatilhos automáticos, configure webhooks/cron (Fase 10).</li>
    </ul>
   </div>
  </div>
 );
}
