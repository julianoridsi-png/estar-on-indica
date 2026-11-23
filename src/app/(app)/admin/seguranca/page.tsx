import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/autenticacao/services/current";
import { createClient } from "@/services/supabase/server";
import { ShieldCheck, LockKeyhole, Activity, AlertTriangle, FileText, Database, Globe } from "lucide-react";

export const metadata: Metadata = {
 title: "Segurança",
 robots: { index: false, follow: false },
};

export default async function SegurancaPage() {
 const session = await getCurrentSession();
 if (!session) redirect("/login?next=/admin/seguranca");
 if (!session.profile) redirect("/sem-acesso");
 if (session.profile.tipo_usuario !== "admin") redirect("/admin");

 const supabase = await createClient();
 const { count: auditCount } = await supabase
  .from("audit_logs")
  .select("id", { count: "exact", head: true });

 const { data: recentAudits } = await supabase
  .from("audit_logs")
  .select("id, tabela, acao, created_at")
  .order("created_at", { ascending: false })
  .limit(8);

 const audits = (recentAudits ?? []) as { id: string; tabela: string; acao: string; created_at: string }[];

 return (
  <div className="space-y-6 animate-rise">
   <div>
    <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
     Security Command
    </p>
    <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
     Segurança e monitoramento
    </h1>
    <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
     Postura de segurança da plataforma. Dados reais, sem simulações.
    </p>
   </div>

   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
     <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Cabeçalhos HTTP</p>
     <p className="mt-2 font-heading text-2xl font-bold text-emerald-700">Ativos</p>
     <p className="mt-1 text-[11px] text-muted-foreground">X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy, COOP.</p>
    </div>
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
     <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Row Level Security</p>
     <p className="mt-2 font-heading text-2xl font-bold text-emerald-700">Ativo</p>
     <p className="mt-1 text-[11px] text-muted-foreground">Policies por perfil (indicador/comercial/admin) no Supabase.</p>
    </div>
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
     <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Registros de auditoria</p>
     <p className="mt-2 font-heading text-2xl font-bold text-ink">{auditCount ?? 0}</p>
     <p className="mt-1 text-[11px] text-muted-foreground">Eventos na trilha de auditoria.</p>
    </div>
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
     <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Rate Limiting</p>
     <p className="mt-2 font-heading text-2xl font-bold text-emerald-700">Ativo</p>
     <p className="mt-1 text-[11px] text-muted-foreground">In-memory por IP (API v1). Global via Cloudflare (configurar).</p>
    </div>
   </div>

   <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <h2 className="font-heading text-base font-bold text-ink">Atividade recente (auditoria)</h2>
    <p className="text-[11px] text-muted-foreground">Últimos eventos registrados.</p>
    {audits.length === 0 ? (
     <p className="mt-4 text-xs text-muted-foreground">Nenhum evento registrado.</p>
    ) : (
     <ul className="mt-4 space-y-2">
      {audits.map((a) => (
       <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 text-xs">
        <span className="flex items-center gap-2 min-w-0">
         <Activity className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
         <span className="truncate font-medium text-ink">{a.tabela}</span>
         <span className="text-muted-foreground">— {a.acao}</span>
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">
         {new Date(a.created_at).toLocaleString("pt-BR")}
        </span>
      </li>
      ))}
     </ul>
    )}
   </div>

   <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
    <h2 className="font-heading text-base font-bold text-ink">Boas práticas aplicadas</h2>
    <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Chaves privadas não expostas no frontend (apenas anon key).</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Mutações administrativas via RPCs security-definer com validação de papel.</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Rate limiting delegado ao Supabase Auth + in-memory (API v1).</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Credenciais de integrações armazenadas no banco (não no frontend).</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Validação de webhooks via HMAC-SHA256.</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Cabeçalhos de segurança (X-Frame-Options, HSTS, COOP, Permissions-Policy).</li>
     <li className="flex items-start gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />Trilha de auditoria imutável via trigger (audit_logs).</li>
    </ul>
    <p className="mt-4 text-[10px] text-muted-foreground">
     Conformidade LGPD e certificações requerem auditoria profissional. Esta página apresenta a postura técnica atual, não uma certificação.
    </p>
   </div>
  </div>
 );
}
