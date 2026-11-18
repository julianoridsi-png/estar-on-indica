import Image from "next/image";
import Link from "next/link";
import {
 ArrowRight,
 BadgeCheck,
 Banknote,
 Check,
 CircleDollarSign,
 Clock3,
 CreditCard,
 EyeOff,
 FileCheck2,
 Gift,
 History,
 LayoutDashboard,
 LockKeyhole,
 Percent,
 ScrollText,
 Send,
 ShieldCheck,
 Smartphone,
 Sparkles,
 UserCheck,
 UserPlus,
 Wallet,
 Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { TrackingPreview } from "@/shared/marketing/tracking-preview";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { REFERRAL_STATUS_OPTIONS } from "@/features/indicacoes/services/status";

const TRUST_ITEMS = [
 {
 icon: ShieldCheck,
 title: "Segurança e LGPD",
 description: "CPF criptografado e dados mascarados nas telas.",
 },
 {
 icon: Zap,
 title: "Status em tempo real",
 description: "Acompanhe cada movimentação da sua indicação.",
 },
 {
 icon: Gift,
 title: "Recompensas claras",
 description: "Critérios e prazos definidos pela campanha vigente.",
 },
 {
 icon: Smartphone,
 title: "Direto no celular",
 description: "Plataforma responsiva e instalável como aplicativo.",
 },
];

const HOW_IT_STEPS = [
 {
 number: "01",
 icon: UserPlus,
 title: "Crie sua conta",
 description:
 "Cadastre seus dados pessoais com validação de CPF, e-mail e telefone. O aceite dos termos e da política de privacidade é registrado com data e hora.",
 detail: "Cadastro gratuito e 100% digital",
 },
 {
 number: "02",
 icon: Send,
 title: "Indique um amigo",
 description:
 "Informe nome, CPF e e-mail da pessoa indicada. O sistema vincula a indicação à sua conta, registra o histórico e impede duplicidades.",
 detail: "Proteção contra fraudes e repetições",
 },
 {
 number: "03",
 icon: LayoutDashboard,
 title: "Acompanhe e receba",
 description:
 "Veja cada etapa no seu painel, da análise à instalação. A recompensa é liberada somente após o cumprimento das regras da campanha.",
 detail: "Transparência do início ao fim",
 },
];

const REWARD_TYPES = [
 {
 icon: Percent,
 title: "Desconto na mensalidade",
 description: "Abatimento aplicado conforme a campanha.",
 },
 {
 icon: CreditCard,
 title: "Crédito na fatura",
 description: "Crédito registrado no histórico financeiro.",
 },
 {
 icon: Banknote,
 title: "Premiação em dinheiro",
 description: "Liberação após validação e cumprimento das regras.",
 },
 {
 icon: Gift,
 title: "Outras recompensas",
 description: "Benefícios definidos pelo administrador da campanha.",
 },
];

const REWARD_FLOW = [
 {
 icon: Clock3,
 label: "Pendente",
 description: "Aguardando o cumprimento dos critérios da campanha.",
 },
 {
 icon: BadgeCheck,
 label: "Aprovada",
 description: "Revisada e validada pela equipe Estar On.",
 },
 {
 icon: Wallet,
 label: "Disponível",
 description: "Pronta para liberação conforme a campanha vigente.",
 },
 {
 icon: CircleDollarSign,
 label: "Paga",
 description: "Registrada no histórico financeiro com data.",
 },
];

const SECURITY_ITEMS = [
 {
 icon: LockKeyhole,
 title: "CPF criptografado",
 description:
 "O CPF é armazenado de forma criptografada no banco de dados e validado por algoritmo oficial.",
 },
 {
 icon: EyeOff,
 title: "Mascaramento de dados",
 description:
 "Indicadores veem apenas as próprias informações. CPFs são exibidos com máscara.",
 },
 {
 icon: UserCheck,
 title: "Acesso por perfil",
 description:
 "Permissões separadas para indicador, comercial e administrador, com Row Level Security no banco.",
 },
 {
 icon: ScrollText,
 title: "Registro de auditoria",
 description:
 "Alterações de status e ações sensíveis são registradas com responsável e data.",
 },
];

const FAQ_ITEMS = [
 {
 question: "Quem pode participar do programa?",
 answer:
 "Pessoas cadastradas como indicadores na plataforma, após aceitarem os Termos de Uso e a Política de Privacidade. O cadastro é gratuito e sujeito às regras da campanha vigente.",
 },
 {
 question: "Preciso pagar algo para indicar?",
 answer:
 "Não. A participação no programa de indicação é gratuita. A Estar On não cobra taxa de cadastro nem de indicação.",
 },
 {
 question: "Como acompanho o andamento da indicação?",
 answer:
 "Ao entrar no seu painel, você vê todas as indicações, o status atual, a última atualização e a linha do tempo completa. O status é alterado exclusivamente pela equipe da Estar On.",
 },
 {
 question: "Quando a recompensa é liberada?",
 answer:
 "A recompensa é liberada somente quando os critérios da campanha vigente são cumpridos. Valor, tipo, prazo e regras são definidos pelo administrador e ficam disponíveis para consulta.",
 },
 {
 question: "Meus dados e meu CPF ficam visíveis para outras pessoas?",
 answer:
 "Não. Cada indicador acessa somente os próprios dados e as indicações vinculadas à sua conta. O CPF é armazenado criptografado e exibido de forma mascarada. Apenas usuários administrativos autorizados podem consultar informações completas, com registro de auditoria.",
 },
 {
 question: "Posso indicar a mesma pessoa mais de uma vez?",
 answer:
 "Não. O sistema bloqueia CPF duplicado, indicações repetidas e autorreferência. Essas proteções existem para preservar a integridade da campanha e evitar fraudes.",
 },
];

export default function HomePage() {
 return (
 <>
 <div className="overflow-hidden">
 <Image
 src="/branding/indique-ganhe-banner.png"
 alt="Estar On faz o Pix — Indique e Ganhe R$ 50,00"
 width={1920}
 height={650}
 className="h-auto w-full object-cover"
 priority
 />
 </div>

 <section className="hero-glow relative overflow-hidden bg-[#31393F]">
 <div
 aria-hidden="true"
 className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black_20%,transparent_92%)]"
 />
 <div className="container-page relative grid items-center gap-14 py-14 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:py-24">
 <div className="animate-rise">
 <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-brand-200 uppercase shadow-sm backdrop-blur-sm">
 <Sparkles className="size-3.5 text-brand-300" aria-hidden="true" />
 Programa oficial Estar On Internet
 </span>

 <h1 className="mt-6 font-heading text-[2.45rem] leading-[1.05] font-bold text-white sm:text-5xl xl:text-[3.6rem]">
 A internet conecta.
 <br />
 <span className="text-brand-300">A EstarOn recompensa!!!</span>
 </h1>

 <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-200 sm:text-base">
 Indique o melhor provedor de internet da região e ganhe R$ 50 por
 cada amigo que contratar a EstarOn!
 </p>

 <div className="mt-7 flex flex-col gap-3 sm:flex-row">
 <Button asChild size="lg" className="h-13 bg-brand-500 px-7 text-ink hover:bg-brand-400">
 <Link href="/cadastro">
 Quero participar
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="lg"
 className="h-13 border-white/20 bg-white/10 px-6 text-white hover:bg-white/20"
 >
 <Link href="/login">
 <LayoutDashboard className="size-4" aria-hidden="true" />
 Já sou indicador
 </Link>
 </Button>
 </div>

 <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-muted-foreground">
 {[
 "Participação gratuita",
 "Regras transparentes",
 "Acompanhamento em tempo real",
 ].map((item) => (
 <li key={item} className="flex items-center gap-1.5">
 <Check
 className="size-3.5 text-emerald-600"
 aria-hidden="true"
 />
 {item}
 </li>
 ))}
 </ul>
 </div>

 <div className="relative lg:pl-6">
 <TrackingPreview />
 </div>
 </div>
 </section>

 <section className="border-y border-border bg-card">
 <div className="container-page grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
 {TRUST_ITEMS.map((item) => {
 const Icon = item.icon;
 return (
 <div
 key={item.title}
 className="flex items-start gap-3.5 px-0 py-5 sm:px-5 sm:py-6 lg:px-6"
 >
 <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-[13px] font-bold text-ink">
 {item.title}
 </h2>
 <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
 {item.description}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </section>

 <section id="como-funciona" className="scroll-mt-24 bg-card py-16 lg:py-24">
 <div className="container-page">
 <div className="mx-auto max-w-2xl text-center">
 <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
 Como funciona
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
 Três passos para começar
 </h2>
 <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
 Um processo simples, com validações de segurança em cada etapa e
 acompanhamento completo pelo painel do indicador.
 </p>
 </div>

 <div className="mt-10 grid gap-5 lg:grid-cols-3">
 {HOW_IT_STEPS.map((step) => {
 const Icon = step.icon;
 return (
 <article
 key={step.number}
 className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift"
 >
 <div
 aria-hidden="true"
 className="absolute -top-6 -right-2 font-heading text-7xl font-bold text-brand-50 transition-colors group-hover:text-brand-100"
 >
 {step.number}
 </div>
 <div className="relative">
 <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand-300 shadow-glow">
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <h3 className="mt-5 font-heading text-lg font-bold text-ink">
 {step.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 {step.description}
 </p>
 <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-[11px] font-semibold text-brand-700">
 <BadgeCheck className="size-4" aria-hidden="true" />
 {step.detail}
 </div>
 </div>
 </article>
 );
 })}
 </div>

 <div className="mt-9 flex justify-center">
 <Button asChild size="lg" className="px-7">
 <Link href="/cadastro">
 Criar minha conta agora
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 </div>
 </div>
 </section>

 <section
 id="acompanhamento"
 className="panel-dark relative scroll-mt-24 overflow-hidden py-16 text-white lg:py-24"
 >
 <div
 aria-hidden="true"
 className="bg-dots absolute inset-0 opacity-25"
 />
 <div className="container-page relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
 <div>
 <p className="text-xs font-bold tracking-[0.22em] text-brand-300 uppercase">
 Acompanhamento completo
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
 Você sabe exatamente
 <br />
 onde sua indicação está.
 </h2>
 <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-300">
 Cada mudança de status é registrada com data, responsável e
 observações. Você acompanha a evolução, mas apenas a equipe Estar
 On altera as etapas.
 </p>

 <ul className="mt-7 space-y-3">
 {[
 "Linha do tempo com todas as movimentações",
 "Histórico com responsável e data da alteração",
 "Observações administrativas quando necessário",
 "Proteção total contra alterações indevidas",
 ].map((item) => (
 <li key={item} className="flex items-start gap-2.5 text-sm text-slate-200">
 <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
 <Check className="size-3" aria-hidden="true" />
 </span>
 {item}
 </li>
 ))}
 </ul>

 <Button
 asChild
 variant="outline"
 size="lg"
 className="mt-8 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
 >
 <Link href="/regras">
 Consultar regras da campanha
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 </div>

 <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-lift backdrop-blur-sm sm:p-6">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-[10px] font-bold tracking-[0.2em] text-brand-300 uppercase">
 Fluxo de status
 </p>
 <h3 className="mt-1 font-heading text-lg font-bold text-white">
 Da recepção à instalação
 </h3>
 </div>
 <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-slate-200">
 11 status
 </span>
 </div>

 <ul className="mt-5 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
 {REFERRAL_STATUS_OPTIONS.map((status) => (
 <li
 key={status.value}
 className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-2"
 >
 <span
 className={`size-2 shrink-0 rounded-full ${status.dotClass}`}
 aria-hidden="true"
 />
 <span className="text-[11px] font-medium text-slate-200">
 {status.label}
 </span>
 </li>
 ))}
 </ul>

 <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-slate-400">
 <History className="size-3.5 text-brand-300" aria-hidden="true" />
 Todas as etapas ficam registradas no histórico da indicação.
 </p>
 </div>
 </div>
 </section>

 <section id="recompensas" className="scroll-mt-24 bg-background py-16 lg:py-24">
 <div className="container-page grid items-center gap-12 lg:grid-cols-2">
 <div>
 <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
 Recompensas
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
 Reconhecimento por cada
 <br className="hidden sm:block" /> nova conexão.
 </h2>
 <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
 O administrador define o tipo, o valor, o critério de liberação e
 o prazo de cada campanha. Tudo fica registrado no seu histórico —
 sem surpresas e sem pagamentos automáticos.
 </p>

 <div className="mt-7 grid gap-3 sm:grid-cols-2">
 {REWARD_TYPES.map((reward) => {
 const Icon = reward.icon;
 return (
 <div
 key={reward.title}
 className="rounded-2xl border border-border bg-card p-4 shadow-soft"
 >
 <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
 <Icon className="size-4.5" aria-hidden="true" />
 </span>
 <h3 className="mt-3 font-heading text-[13px] font-bold text-ink">
 {reward.title}
 </h3>
 <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
 {reward.description}
 </p>
 </div>
 );
 })}
 </div>
 </div>

 <div className="relative">
 <div
 aria-hidden="true"
 className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-brand-100 via-white to-cyan-50 blur-xl"
 />
 <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-[10px] font-bold tracking-[0.2em] text-brand-600 uppercase">
 Ciclo da recompensa
 </p>
 <h3 className="mt-1 font-heading text-xl font-bold text-ink">
 Como a liberação acontece
 </h3>
 </div>
 <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
 <Gift className="size-5" aria-hidden="true" />
 </span>
 </div>

 <ol className="mt-6 space-y-4">
 {REWARD_FLOW.map((item, index) => {
 const Icon = item.icon;
 return (
 <li key={item.label} className="flex gap-3.5">
 <div className="flex flex-col items-center">
 <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <Icon className="size-4" aria-hidden="true" />
 </span>
 {index < REWARD_FLOW.length - 1 ? (
 <span className="my-1 h-7 w-px bg-border" />
 ) : null}
 </div>
 <div className="pt-0.5">
 <h4 className="text-sm font-semibold text-ink">
 {item.label}
 </h4>
 <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
 {item.description}
 </p>
 </div>
 </li>
 );
 })}
 </ol>

 <p className="mt-5 rounded-xl bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900 ring-1 ring-amber-200 ring-inset">
 <strong>Importante:</strong> a plataforma não realiza
 pagamentos automáticos. A liberação depende da validação da
 equipe Estar On e das regras da campanha vigente.
 </p>
 </div>
 </div>
 </div>
 </section>

 <section className="border-y border-border bg-card py-16 lg:py-24">
 <div className="container-page grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
 <div>
 <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
 Segurança e privacidade
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
 Seus dados tratados
 <br className="hidden sm:block" /> com responsabilidade.
 </h2>
 <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
 A plataforma foi estruturada para atender aos princípios da LGPD,
 com controle de acesso por perfil, criptografia de dados
 sensíveis e registro de auditoria.
 </p>
 <Button asChild variant="outline" size="lg" className="mt-6">
 <Link href="/privacidade">
 <FileCheck2 className="size-4" aria-hidden="true" />
 Ler política de privacidade
 </Link>
 </Button>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 {SECURITY_ITEMS.map((item) => {
 const Icon = item.icon;
 return (
 <div
 key={item.title}
 className="rounded-2xl border border-border bg-background p-5"
 >
 <span className="grid size-10 place-items-center rounded-xl bg-card text-brand-600 shadow-sm ring-1 ring-border">
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <h3 className="mt-3.5 font-heading text-sm font-bold text-ink">
 {item.title}
 </h3>
 <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
 {item.description}
 </p>
 </div>
 );
 })}
 </div>
 </div>
 </section>

 <section id="duvidas" className="scroll-mt-24 bg-background py-16 lg:py-24">
 <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
 <div>
 <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
 Perguntas frequentes
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
 Dúvidas antes
 <br /> de começar?
 </h2>
 <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
 Reunimos as principais perguntas sobre cadastro, indicações,
 recompensas e privacidade. Se precisar de ajuda, use os canais
 oficiais de atendimento da Estar On.
 </p>
 <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
 <p className="flex items-center gap-2 text-xs font-semibold text-brand-900">
 <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
 Programa oficial e gratuito
 </p>
 <p className="mt-1 text-[11px] leading-relaxed text-brand-800/80">
 Consulte sempre as regras da campanha vigente antes de
 participar.
 </p>
 </div>
 </div>

 <div className="space-y-2.5">
 {FAQ_ITEMS.map((item) => (
 <details
 key={item.question}
 className="group rounded-2xl border border-border bg-card px-5 shadow-soft open:border-brand-200"
 >
 <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
 {item.question}
 <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-transform group-open:rotate-45">
 <span className="text-base leading-none">+</span>
 </span>
 </summary>
 <p className="pb-4 text-[13px] leading-relaxed text-muted-foreground">
 {item.answer}
 </p>
 </details>
 ))}
 </div>
 </div>
 </section>

 <section className="bg-card pb-16 lg:pb-20">
 <div className="container-page">
 <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-[#31474f] to-[#1b282e] px-6 py-10 shadow-lift sm:px-10 lg:px-14 lg:py-14">
 <div
 aria-hidden="true"
 className="bg-dots absolute inset-0 opacity-30"
 />
 <div
 aria-hidden="true"
 className="absolute -top-24 -right-16 size-72 rounded-full bg-aqua/20 blur-3xl"
 />
 <div className="relative grid items-center gap-6 lg:grid-cols-[1.3fr_0.7fr]">
 <div>
 <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wider text-brand-100 uppercase">
 <Sparkles className="size-3" aria-hidden="true" />
 Comece agora
 </span>
 <h2 className="mt-3 font-heading text-3xl font-bold text-white sm:text-4xl">
 Pronto para indicar?
 </h2>
 <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100">
 Crie sua conta gratuitamente, indique pessoas de confiança e
 acompanhe cada etapa até a instalação.
 </p>
 </div>
 <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch">
 <Button
 asChild
 size="lg"
 className="bg-brand-500 text-ink shadow-none hover:bg-brand-400"
 >
 <Link href="/cadastro">
 Criar minha conta
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="lg"
 className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
 >
 <Link href="/login">Já tenho conta</Link>
 </Button>
 </div>
 </div>
 <p className="relative mt-6 flex items-center gap-2 text-[10px] text-brand-200">
 <StatusBadge
 status="instalado"
 className="bg-white/10 text-white ring-white/20"
 />
 O acompanhamento chega até a confirmação da instalação.
 </p>
 </div>
 </div>
 </section>
 </>
 );
}
