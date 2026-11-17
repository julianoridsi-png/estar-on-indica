import Link from "next/link";
import { AlertTriangle, ChevronRight, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

export function LegalPage({
  title,
  description,
  version,
  updatedAt,
  children,
}: {
  title: string;
  description: string;
  version: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card">
      <div className="border-b border-border bg-gradient-to-b from-brand-50/80 to-white">
        <div className="container-page max-w-4xl py-10 lg:py-14">
          <nav
            aria-label="Você está aqui"
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-brand-700">
              Início
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="text-foreground">{title}</span>
          </nav>

          <div className="mt-5 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-ink text-brand-300 shadow-glow">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-brand-600 uppercase">
                Documento oficial
              </p>
              <h1 className="font-heading text-2xl font-bold text-ink sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="h-6 rounded-full border-brand-200 bg-card px-3 text-[10px] font-semibold text-brand-800"
            >
              Versão {version}
            </Badge>
            <Badge
              variant="outline"
              className="h-6 rounded-full border-border bg-card px-3 text-[10px] font-semibold text-muted-foreground"
            >
              Atualizado em {updatedAt}
            </Badge>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
              Documento público
            </span>
          </div>
        </div>
      </div>

      <div className="container-page max-w-4xl py-8 lg:py-12">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <p className="text-[12px] leading-relaxed">
            <strong>Versão inicial.</strong> Este documento foi estruturado
            para a plataforma Estar On Indica e deve passar por revisão jurídica
            e complementação dos dados empresariais oficiais antes da
            publicação comercial.
          </p>
        </div>

        <article className="mt-9 space-y-8">{children}</article>

        <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-5">
          <h2 className="font-heading text-sm font-bold text-ink">
            Precisa de esclarecimentos?
          </h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            Utilize os canais oficiais de atendimento da Estar On Internet. Para
            solicitações relacionadas aos seus dados pessoais, informe
            claramente o direito que deseja exercer e os dados necessários para
            sua identificação.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
