"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
 ArrowLeft,
 CheckCircle2,
 Loader2,
 MapPin,
 Search,
 Send,
 ShieldCheck,
 UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/select";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { FormField } from "@/features/autenticacao/components/form-field";
import { createReferralAction } from "@/features/indicacoes/services/actions";
import { ESTADOS, formatCepInput, isValidCep } from "@/shared/lib/validation/br";
import { formatCpfInput } from "@/shared/lib/validation/cpf";
import { formatPhoneInput } from "@/shared/lib/validation/phone";
import { lookupCep } from "@/shared/lib/validation/cep";
import {
 referralFormSchema,
 type ReferralFormValues,
} from "@/features/indicacoes/schemas/referral";
import { cn } from "@/shared/lib/utils";

type CepStatus = "idle" | "loading" | "found" | "manual";

const CEP_HINT: Record<CepStatus, string> = {
 idle: "Digite o CEP para preencher o endereço automaticamente.",
 loading: "Buscando endereço no ViaCEP...",
 found: "Endereço preenchido. Confira e ajuste se necessário.",
 manual: "Não encontramos o CEP. Preencha o endereço manualmente.",
};

const FIELD_KEYS = new Set([
 "indicado_nome",
 "indicado_cpf",
 "indicado_email",
 "indicado_telefone",
 "cep",
 "endereco",
 "numero",
 "complemento",
 "bairro",
 "cidade",
 "estado",
 "observacoes",
 "consentimento",
]);

export function ReferralForm() {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [serverError, setServerError] = useState<string | null>(null);
 const [cepStatus, setCepStatus] = useState<CepStatus>("idle");

 const {
 control,
 register,
 handleSubmit,
 getValues,
 setValue,
 setError,
 formState: { errors },
 } = useForm<ReferralFormValues>({
 resolver: zodResolver(referralFormSchema),
 mode: "onTouched",
 defaultValues: {
 indicado_nome: "",
 indicado_cpf: "",
 indicado_email: "",
 indicado_telefone: "",
 cep: "",
 endereco: "",
 numero: "",
 complemento: "",
 bairro: "",
 cidade: "",
 estado: "",
 observacoes: "",
 consentimento: false,
 },
 });

 const handleCepLookup = async () => {
 const cep = getValues("cep");

 if (!isValidCep(cep)) {
 setCepStatus("idle");
 return;
 }

 setCepStatus("loading");
 const address = await lookupCep(cep);

 if (!address) {
 setCepStatus("manual");
 return;
 }

 if (address.endereco) {
 setValue("endereco", address.endereco, { shouldValidate: true });
 }
 if (address.bairro) {
 setValue("bairro", address.bairro, { shouldValidate: true });
 }
 if (address.cidade) {
 setValue("cidade", address.cidade, { shouldValidate: true });
 }
 if (address.estado) {
 setValue("estado", address.estado, { shouldValidate: true });
 }

 setCepStatus("found");
 };

 const onSubmit = (values: ReferralFormValues) => {
 setServerError(null);

 startTransition(async () => {
 const result = await createReferralAction(values);

 if (result.status === "error") {
 setServerError(result.message);

 if (result.field && FIELD_KEYS.has(result.field)) {
 setError(result.field as keyof ReferralFormValues, {
 message: result.message,
 });
 }

 toast.error("Não foi possível cadastrar a indicação", {
 description: result.message,
 });
 return;
 }

 toast.success("Indicação cadastrada", {
 description: result.message,
 });
 router.push("/indicacoes?cadastro=1");
 router.refresh();
 });
 };

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
 <FormErrorAlert message={serverError} />

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
 <div className="flex items-center gap-2.5">
 <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <UserRound className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Dados da pessoa indicada
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Informe os dados de contato de quem você está indicando.
 </p>
 </div>
 </div>

 <div className="mt-5 grid gap-4 sm:grid-cols-2">
 <FormField
 label="Nome completo"
 htmlFor="indicado_nome"
 required
 error={errors.indicado_nome?.message}
 className="sm:col-span-2"
 >
 <Input
 id="indicado_nome"
 autoComplete="name"
 placeholder="Nome e sobrenome da pessoa indicada"
 aria-invalid={Boolean(errors.indicado_nome)}
 {...register("indicado_nome")}
 />
 </FormField>

 <FormField
 label="CPF (opcional)"
 htmlFor="indicado_cpf"
 error={errors.indicado_cpf?.message}
 hint="Informe apenas se tiver o CPF da pessoa indicada."
 >
 <Controller
 control={control}
 name="indicado_cpf"
 render={({ field }) => (
 <Input
 id="indicado_cpf"
 inputMode="numeric"
 autoComplete="off"
 placeholder="000.000.000-00"
 aria-invalid={Boolean(errors.indicado_cpf)}
 {...field}
 onChange={(event) =>
 field.onChange(formatCpfInput(event.target.value))
 }
 />
 )}
 />
 </FormField>

 <FormField
 label="Telefone / WhatsApp"
 htmlFor="indicado_telefone"
 required
 error={errors.indicado_telefone?.message}
 >
 <Controller
 control={control}
 name="indicado_telefone"
 render={({ field }) => (
 <Input
 id="indicado_telefone"
 inputMode="tel"
 autoComplete="tel"
 placeholder="(11) 99999-9999"
 aria-invalid={Boolean(errors.indicado_telefone)}
 {...field}
 onChange={(event) =>
 field.onChange(formatPhoneInput(event.target.value))
 }
 />
 )}
 />
 </FormField>

 <FormField
 label="E-mail"
 htmlFor="indicado_email"
 required
 error={errors.indicado_email?.message}
 className="sm:col-span-2"
 >
 <Input
 id="indicado_email"
 type="email"
 autoComplete="email"
 placeholder="pessoa@exemplo.com"
 aria-invalid={Boolean(errors.indicado_email)}
 {...register("indicado_email")}
 />
 </FormField>
 </div>

 <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3">
 <ShieldCheck
 className="mt-0.5 size-4 shrink-0 text-emerald-600"
 aria-hidden="true"
 />
 <p className="text-[10px] leading-relaxed text-muted-foreground">
 O CPF completo é usado apenas para validar a indicação e fica
 criptografado no banco. As telas mostram somente os dois últimos
 dígitos.
 </p>
 </div>
 </section>

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
 <div className="flex items-center gap-2.5">
 <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <MapPin className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Endereço do serviço
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Endereço onde a instalação poderá ser realizada.
 </p>
 </div>
 </div>

 <div className="mt-5 grid gap-4 sm:grid-cols-6">
 <FormField
 label="CEP"
 htmlFor="indicado_cep"
 required
 error={errors.cep?.message}
 hint={
 <span
 className={cn(
 "inline-flex items-center gap-1",
 cepStatus === "loading" && "text-brand-700",
 cepStatus === "found" && "text-emerald-700",
 )}
 >
 {cepStatus === "loading" ? (
 <Loader2 className="size-3 animate-spin" aria-hidden="true" />
 ) : (
 <Search className="size-3" aria-hidden="true" />
 )}
 {CEP_HINT[cepStatus]}
 </span>
 }
 className="sm:col-span-2"
 >
 <Controller
 control={control}
 name="cep"
 render={({ field }) => (
 <Input
 id="indicado_cep"
 inputMode="numeric"
 autoComplete="postal-code"
 placeholder="00000-000"
 aria-invalid={Boolean(errors.cep)}
 {...field}
 onChange={(event) =>
 field.onChange(formatCepInput(event.target.value))
 }
 onBlur={() => {
 field.onBlur();
 void handleCepLookup();
 }}
 />
 )}
 />
 </FormField>

 <FormField
 label="Endereço"
 htmlFor="indicado_endereco"
 required
 error={errors.endereco?.message}
 className="sm:col-span-4"
 >
 <Input
 id="indicado_endereco"
 autoComplete="street-address"
 placeholder="Rua, avenida, travessa..."
 aria-invalid={Boolean(errors.endereco)}
 {...register("endereco")}
 />
 </FormField>

 <FormField
 label="Número"
 htmlFor="indicado_numero"
 required
 error={errors.numero?.message}
 className="sm:col-span-2"
 >
 <Input
 id="indicado_numero"
 inputMode="numeric"
 placeholder="123"
 aria-invalid={Boolean(errors.numero)}
 {...register("numero")}
 />
 </FormField>

 <FormField
 label="Complemento"
 htmlFor="indicado_complemento"
 error={errors.complemento?.message}
 className="sm:col-span-4"
 >
 <Input
 id="indicado_complemento"
 placeholder="Apto, bloco, casa (opcional)"
 {...register("complemento")}
 />
 </FormField>

 <FormField
 label="Bairro"
 htmlFor="indicado_bairro"
 required
 error={errors.bairro?.message}
 className="sm:col-span-3"
 >
 <Input
 id="indicado_bairro"
 placeholder="Bairro"
 aria-invalid={Boolean(errors.bairro)}
 {...register("bairro")}
 />
 </FormField>

 <FormField
 label="Cidade"
 htmlFor="indicado_cidade"
 required
 error={errors.cidade?.message}
 className="sm:col-span-2"
 >
 <Input
 id="indicado_cidade"
 placeholder="Cidade"
 aria-invalid={Boolean(errors.cidade)}
 {...register("cidade")}
 />
 </FormField>

 <FormField
 label="UF"
 htmlFor="indicado_estado"
 required
 error={errors.estado?.message}
 className="sm:col-span-1"
 >
 <Controller
 control={control}
 name="estado"
 render={({ field }) => (
 <Select
 value={field.value || undefined}
 onValueChange={(value) => field.onChange(value)}
 >
 <SelectTrigger
 id="indicado_estado"
 className="h-10 w-full"
 aria-invalid={Boolean(errors.estado)}
 >
 <SelectValue placeholder="UF" />
 </SelectTrigger>
 <SelectContent>
 {ESTADOS.map((estado) => (
 <SelectItem key={estado.uf} value={estado.uf}>
 {estado.uf}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 )}
 />
 </FormField>
 </div>
 </section>

 <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
 <div className="flex items-center gap-2.5">
 <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
 <CheckCircle2 className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="font-heading text-base font-bold text-ink">
 Observações e autorização
 </h2>
 <p className="text-[11px] text-muted-foreground">
 Informações úteis para a equipe e confirmação de consentimento.
 </p>
 </div>
 </div>

 <div className="mt-5 space-y-4">
 <FormField
 label="Observações"
 htmlFor="indicado_observacoes"
 error={errors.observacoes?.message}
 hint="Opcional. Conte o que a pessoa procura ou o melhor horário de contato."
 >
 <Textarea
 id="indicado_observacoes"
 rows={4}
 maxLength={1000}
 placeholder="Ex.: prefere contato à tarde, tem interesse em internet residencial..."
 {...register("observacoes")}
 />
 </FormField>

 <Controller
 control={control}
 name="consentimento"
 render={({ field, fieldState }) => (
 <div>
 <div
 className={cn(
 "flex items-start gap-3 rounded-xl border p-3.5",
 fieldState.error
 ? "border-destructive/40 bg-red-50/60"
 : "border-border bg-muted/30",
 )}
 >
 <Checkbox
 id="consentimento"
 checked={Boolean(field.value)}
 onCheckedChange={(checked) =>
 field.onChange(checked === true)
 }
 aria-invalid={Boolean(fieldState.error)}
 className="mt-0.5"
 />
 <label
 htmlFor="consentimento"
 className="text-xs leading-relaxed text-muted-foreground"
 >
 Declaro que tenho autorização da pessoa indicada para
 compartilhar os dados informados com a equipe Estar On, nos
 termos da{" "}
 <Link
 href="/privacidade"
 target="_blank"
 rel="noopener noreferrer"
 className="font-semibold text-brand-700 hover:underline"
 >
 Política de Privacidade
 </Link>
 .
 </label>
 </div>
 {fieldState.error ? (
 <p
 role="alert"
 className="mt-1 text-xs font-medium text-destructive"
 >
 {fieldState.error.message}
 </p>
 ) : null}
 </div>
 )}
 />
 </div>
 </section>

 <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
 <Button asChild type="button" variant="ghost" className="justify-start">
 <Link href="/indicacoes">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar para minhas indicações
 </Link>
 </Button>

 <Button type="submit" disabled={isPending} className="sm:min-w-44">
 {isPending ? (
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 ) : (
 <Send className="size-4" aria-hidden="true" />
 )}
 {isPending ? "Cadastrando..." : "Cadastrar indicação"}
 </Button>
 </div>
 </form>
 );
}
