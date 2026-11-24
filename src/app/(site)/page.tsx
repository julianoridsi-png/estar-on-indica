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
 Wifi,
 Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { TrackingPreview } from "@/shared/marketing/tracking-preview";
import { HeroCarouselServer } from "@/features/banners/components/hero-carousel-server";
import { BenefitsGrid } from "@/features/beneficios/components/benefits-grid";
import { WhatsAppButton } from "@/shared/ui/whatsapp-button";
import { StatusBadge } from "@/features/indicacoes/components/status-badge";
import { REFERRAL_STATUS_OPTIONS } from "@/features/indicacoes/services/status";

const TRUST_ITEMS = [
 {
 icon: Gift,
 title: "Participação gratuita",
 description: "Cadastre-se e indique sem custos. A Estar On não cobra taxa.",
 },
 {
 icon: Clock3,
 title: "Acompanhamento em tempo real",
 description: "Veja cada etapa da sua indicação com data e responsável.",
 },
 {
 icon: ShieldCheck,
 title: "Dados protegidos (LGPD)",
 description: "CPF criptografado e exibido de forma mascarada.",
 },
 {
 icon: Wallet,
 title: "Pagamento via Pix",
 description: "Recompensas liberadas diretamente na sua chave Pix.",
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
 <div className="relative">
 <HeroCarouselServer />
 <section className="hero-glow relative overflow-hidden bg-gradient-to-b from-brand-50/50 to-white">
 <div
  aria-hidden="true"
  className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black_20%,transparent_92%)]"
 />
 <div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0"
  style={{
   background:
    "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(210, 221, 58, 0.10), transparent 70%)"
  }}
 />
 <div className="container-page relative grid items-center gap-14 py-14 sm:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:py-24">
 <div className="animate-rise">
 <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#31393F] uppercase shadow-soft">
 <Sparkles className="size-3.5 text-[#D2DD3A]" aria-hidden="true" />
 Programa oficial Estar On Internet
 </span>

 <h1 className="mt-6 font-heading text-[2.45rem] leading-[1.05] font-bold text-[#31393F] sm:text-5xl xl:text-[3.6rem]">
 A internet conecta.
 <br />
 <span className="text-brand-600">A Estar On recompensa!</span>
 </h1>

 <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink/80 sm:text-base">
 Indique o melhor provedor de internet da região e ganhe R$ 50 por
 cada amigo que contratar a Estar On!
 </p>
 <span className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-brand-300 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-800 shadow-soft ring-1 ring-brand-200/50">
 <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
 R$ 50 por amigo que contratar
 </span>

 <div className="mt-7 flex flex-col gap-3 sm:flex-row">
 <Button asChild size="lg" className="h-12 bg-brand-500 px-7 text-ink hover:bg-brand-400">
 <Link href="/cadastro">
 Quero participar
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Button>
 <Button
 asChild
 variant="outline"
 size="lg"
 className="h-12 border-brand-200 bg-brand-50 px-6 text-[#31393F] hover:bg-brand-50"
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

 </div>

 <section className="border-y border-brand-200/60 bg-card">
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

 <section id="como-funciona" className="scroll-mt-24 bg-gradient-to-b from-brand-50/30 to-card py-16 lg:py-24">
 <div className="container-page">
 <div className="mx-auto max-w-2xl text-center">
 <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
 Como funciona
 </p>
 <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
 Como funciona o Indique e Ganhe
 </h2>
 <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
 Indique um amigo, familiar ou conhecido interessado em contratar a Estar On.
 Nossa equipe cuida do contato, da análise de viabilidade e da instalação.
 Após o pagamento da primeira mensalidade, sua bonificação é liberada conforme a campanha vigente.
 </p>
 </div>

 <div className="relative mt-10">
   <div aria-hidden="true" className="pointer-events-none absolute left-8 right-8 top-9 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent lg:block" />
   <div className="grid gap-5 lg:grid-cols-3">
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

 <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
 {[
 { label: "Indicação", desc: "Cadastro recebido", icon: Send, done: true },
 { label: "Análise", desc: "Triagem e viabilidade", icon: Clock3, done: true },
 { label: "Contrato", desc: "Contratação aprovada", icon: BadgeCheck, done: true },
 { label: "Instalação", desc: "Serviço instalado", icon: Wifi, done: true },
 { label: "1ª mensalidade", desc: "Pagamento confirmado", icon: CreditCard, done: false },
 { label: "Bonificação", desc: "Recompensa liberada", icon: Wallet, done: false },
 ].map((step, index, arr) => {
 const Icon = step.icon;
 return (
 <>
 <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:flex-1">
 <span
 className={`grid size-10 shrink-0 place-items-center rounded-full ring-1 ${step.done ? "bg-brand-500 text-ink ring-brand-400" : "bg-white/10 text-slate-300 ring-white/20"}`}
 >
 <Icon className="size-4" aria-hidden="true" />
 </span>
 <div className="min-w-0 sm:mt-2">
 <p className="text-xs font-semibold text-white">{step.label}</p>
 <p className="text-[10px] text-slate-400">{step.desc}</p>
 </div>
 </div>
 {index < arr.length - 1 ? (
 <span
 aria-hidden="true"
 className="hidden h-px flex-1 self-center bg-white/15 sm:block"
 />
 ) : null}
 </>
 );
 })}
 </div>

 <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-slate-400">
 <History className="size-3.5 text-[#D2DD3A]" aria-hidden="true" />
 Todas as etapas ficam registradas no histórico da indicação.
 </p>
 </div>
 </div>
 </section>

 <section id="recompensas" className="scroll-mt-24 bg-gradient-to-b from-background to-brand-50/20 py-16 lg:py-24">
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

 <section className="border-y border-brand-200/60 bg-card py-16 lg:py-24">
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

 <section id="exemplo" className="scroll-mt-24 bg-background py-16 lg:py-24">
  <div className="container-page">
   <div className="mx-auto max-w-2xl text-center">
    <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
     Exemplo ilustrativo
    </p>
    <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
     Veja como funciona na prática
    </h2>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
     Os valores são definidos pela campanha vigente. Abaixo, um exemplo simplificado.
    </p>
   </div>
   <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
    <div className="grid gap-4 sm:grid-cols-3">
     <div className="rounded-xl border border-border bg-background p-4 text-center">
      <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
       Indicações
      </p>
      <p className="mt-2 font-heading text-3xl font-bold text-ink">3</p>
     </div>
     <div className="rounded-xl border border-border bg-background p-4 text-center">
      <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
       Valor por indicação
      </p>
      <p className="mt-2 font-heading text-3xl font-bold text-ink">R$ 50</p>
     </div>
     <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
      <p className="text-[10px] font-bold tracking-[0.16em] text-brand-700 uppercase">
       Total
      </p>
      <p className="mt-2 font-heading text-3xl font-bold text-brand-800">R$ 150</p>
     </div>
    </div>
    <p className="mt-5 text-center text-[11px] text-muted-foreground">
     Exemplo ilustrativo. A liberação depende da validação da equipe Estar On e das regras da campanha vigente.
    </p>
   </div>
  </div>
  </section>

 <section id="beneficios" className="scroll-mt-24 bg-card py-16 lg:py-24">
  <div className="container-page">
   <div className="mx-auto max-w-2xl text-center">
    <p className="text-xs font-bold tracking-[0.22em] text-brand-600 uppercase">
     ON Benefits
    </p>
    <h2 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
     Benefícios exclusivos
    </h2>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
     Vantagens e campanhas especiais para clientes Estar On.
    </p>
   </div>
   <div className="mt-10">
    <BenefitsGrid />
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

 <section className="bg-gradient-to-b from-card to-brand-50/30 pb-16 lg:pb-20">
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
 <WhatsAppButton />
 </>
 );
}
