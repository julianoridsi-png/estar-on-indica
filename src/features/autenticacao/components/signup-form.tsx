"use client";

import Link from "next/link";
import { Fragment, useState, useTransition } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
 ArrowLeft,
 ArrowRight,
 Check,
 Circle,
 Loader2,
 LockKeyhole,
 MapPin,
 ShieldCheck,
 UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/shared/ui/select";
import { FormField } from "@/features/autenticacao/components/form-field";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { PasswordInput } from "@/features/autenticacao/components/password-input";
import { SetupAlert } from "@/features/autenticacao/components/setup-alert";
import { signUpAction } from "@/features/autenticacao/services/actions";
import { cn } from "@/shared/lib/utils";
import {
 SIGNUP_STEP_FIELDS,
 signupFormSchema,
 type SignupFormValues,
} from "@/features/autenticacao/schemas/auth";
import { formatCepInput, isValidCep, isValidUf, ESTADOS } from "@/shared/lib/validation/br";
import { lookupCep } from "@/shared/lib/validation/cep";
import { formatCpfInput } from "@/shared/lib/validation/cpf";
import { formatPhoneInput } from "@/shared/lib/validation/phone";

const STEPS = [
 { title: "Seus dados", icon: UserRound },
 { title: "Endereço", icon: MapPin },
 { title: "Acesso", icon: LockKeyhole },
] as const;

type CepStatus = "idle" | "loading" | "found" | "manual";

function stepForField(field?: string): number {
 if (!field) return 0;
 if (["nome_completo", "cpf", "email", "telefone"].includes(field)) return 0;
 if (
 ["cep", "endereco", "numero", "complemento", "bairro", "cidade", "estado"].includes(
 field,
 )
 )
 return 1;
 return 2;
}

export function SignupForm({ configured }: { configured: boolean }) {
 const [step, setStep] = useState(0);
 const [serverError, setServerError] = useState<string | null>(null);
 const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
 const [isPending, startTransition] = useTransition();
 const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

 const {
 register,
 handleSubmit,
 trigger,
 control,
 getValues,
 setValue,
 setError,
 formState: { errors },
 } = useForm<SignupFormValues>({
 resolver: zodResolver(signupFormSchema),
 mode: "onTouched",
 defaultValues: {
 nome_completo: "",
 cpf: "",
 email: "",
 telefone: "",
 cep: "",
 endereco: "",
 numero: "",
 complemento: "",
 bairro: "",
 cidade: "",
 estado: "",
 senha: "",
 confirmar_senha: "",
 aceite_termos: false,
 },
 });

 const senhaValue = useWatch({ control, name: "senha" }) ?? "";
 const passwordChecks = [
 { label: "8 ou mais caracteres", ok: senhaValue.length >= 8 },
 { label: "Uma letra maiúscula", ok: /[A-Z]/.test(senhaValue) },
 { label: "Uma letra minúscula", ok: /[a-z]/.test(senhaValue) },
 { label: "Um número", ok: /[0-9]/.test(senhaValue) },
 ];
 const passwordScore = passwordChecks.filter((check) => check.ok).length;
 const strengthMeta =
 [
 { label: "", color: "bg-border" },
 { label: "Muito fraca", color: "bg-red-500" },
 { label: "Fraca", color: "bg-orange-500" },
 { label: "Boa", color: "bg-amber-500" },
 { label: "Forte", color: "bg-emerald-500" },
 ][passwordScore] ?? { label: "", color: "bg-border" };

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
 if (isValidUf(address.estado)) {
 setValue("estado", address.estado, { shouldValidate: true });
 }

 setCepStatus("found");
 };

 const goToNextStep = async () => {
 setServerError(null);
 const valid = await trigger([...SIGNUP_STEP_FIELDS[step]], {
 shouldFocus: true,
 });

 if (valid) {
 setStep((current) => Math.min(current + 1, STEPS.length - 1));
 window.scrollTo({ top: 0, behavior: "smooth" });
 }
 };

 const onSubmit = (values: SignupFormValues) => {
 setServerError(null);

 startTransition(async () => {
 const result = await signUpAction({ ...values, turnstileToken: turnstileToken ?? undefined });

 if (result.status === "error") {
 setServerError(result.message);

 if (result.field) {
 setError(result.field as keyof SignupFormValues, {
 type: "server",
 message: result.message,
 });
 setStep(stepForField(result.field));
 }

 toast.error("Não foi possível criar a conta", {
 description: result.message,
 });
 return;
 }

 if (result.redirectTo) {
 window.location.assign(result.redirectTo);
 }
 });
 };

 const cepHint =
 cepStatus === "loading"
 ? "Buscando endereço no ViaCEP..."
 : cepStatus === "found"
 ? "Endereço preenchido automaticamente. Confira e ajuste se necessário."
 : cepStatus === "manual"
 ? "Não foi possível buscar o CEP. Preencha o endereço manualmente."
 : "Digite o CEP para preencher o endereço automaticamente.";

 return (
 <div className="animate-rise">
 <div className="mb-6">
 <p className="text-xs font-bold tracking-[0.2em] text-brand-600 uppercase">
 Cadastro de indicador
 </p>
 <h1 className="mt-2 font-heading text-3xl font-bold text-ink">
 Crie sua conta
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Leva menos de 3 minutos. Seus dados são usados apenas para o programa
 de indicação da Estar On.
 </p>
 </div>

 <div className="mb-5 flex items-center gap-2">
 {STEPS.map((item, index) => {
 const Icon = item.icon;
 const isDone = index < step;
 const isCurrent = index === step;

 return (
 <Fragment key={item.title}>
 <div className="flex items-center gap-2">
 <span
 className={cn(
 "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
 isDone
 ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
 : isCurrent
 ? "bg-brand-500 text-ink shadow-glow"
 : "bg-muted text-muted-foreground",
 )}
 >
 {isDone ? (
 <Check className="size-4" aria-hidden="true" />
 ) : (
 <Icon className="size-3.5" aria-hidden="true" />
 )}
 </span>
 <span
 className={cn(
 "hidden text-[11px] font-semibold sm:block",
 isCurrent ? "text-ink" : "text-muted-foreground",
 )}
 >
 {item.title}
 </span>
 </div>
 {index < STEPS.length - 1 ? (
 <span
 className={cn(
 "h-px flex-1",
 index < step ? "bg-emerald-300" : "bg-border",
 )}
 />
 ) : null}
 </Fragment>
 );
 })}
 </div>

 <div className="space-y-4">
 {!configured ? <SetupAlert compact /> : null}
 <FormErrorAlert message={serverError} />

 <form onSubmit={handleSubmit(onSubmit)} noValidate>
 <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
 {step === 0 ? (
 <div className="space-y-4">
 <FormField
 label="Nome completo"
 htmlFor="nome_completo"
 required
 error={errors.nome_completo?.message}
 >
 <Input
 id="nome_completo"
 autoComplete="name"
 placeholder="Nome e sobrenome"
 aria-invalid={Boolean(errors.nome_completo)}
 {...register("nome_completo")}
 />
 </FormField>

 <div className="grid gap-4 sm:grid-cols-2">
 <FormField
 label="CPF"
 htmlFor="cpf"
 required
 error={errors.cpf?.message}
 hint="Usado para evitar cadastros duplicados."
 >
 <Controller
 control={control}
 name="cpf"
 render={({ field, fieldState }) => (
 <Input
 id="cpf"
 inputMode="numeric"
 autoComplete="off"
 placeholder="000.000.000-00"
 maxLength={14}
 value={field.value}
 onChange={(event) =>
 field.onChange(formatCpfInput(event.target.value))
 }
 onBlur={field.onBlur}
 aria-invalid={Boolean(fieldState.error)}
 />
 )}
 />
 </FormField>

 <FormField
 label="Telefone / WhatsApp"
 htmlFor="telefone"
 required
 error={errors.telefone?.message}
 >
 <Controller
 control={control}
 name="telefone"
 render={({ field, fieldState }) => (
 <Input
 id="telefone"
 type="tel"
 inputMode="tel"
 autoComplete="tel"
 placeholder="(11) 99999-9999"
 maxLength={15}
 value={field.value}
 onChange={(event) =>
 field.onChange(formatPhoneInput(event.target.value))
 }
 onBlur={field.onBlur}
 aria-invalid={Boolean(fieldState.error)}
 />
 )}
 />
 </FormField>
 </div>

 <FormField
 label="E-mail"
 htmlFor="email"
 required
 error={errors.email?.message}
 hint="Enviaremos um link para confirmar este e-mail."
 >
 <Input
 id="email"
 type="email"
 inputMode="email"
 autoComplete="email"
 placeholder="voce@exemplo.com"
 aria-invalid={Boolean(errors.email)}
 {...register("email")}
 />
 </FormField>
 </div>
 ) : null}

 {step === 1 ? (
 <div className="space-y-4">
 <FormField
 label="CEP"
 htmlFor="cep"
 required
 error={errors.cep?.message}
 hint={cepHint}
 >
 <Controller
 control={control}
 name="cep"
 render={({ field, fieldState }) => (
 <Input
 id="cep"
 inputMode="numeric"
 autoComplete="postal-code"
 placeholder="00000-000"
 maxLength={9}
 value={field.value}
 onChange={(event) =>
 field.onChange(formatCepInput(event.target.value))
 }
 onBlur={() => {
 field.onBlur();
 void handleCepLookup();
 }}
 aria-invalid={Boolean(fieldState.error)}
 className="max-w-[220px]"
 />
 )}
 />
 </FormField>

 <FormField
 label="Endereço"
 htmlFor="endereco"
 required
 error={errors.endereco?.message}
 >
 <Input
 id="endereco"
 autoComplete="address-line1"
 placeholder="Rua, avenida, travessa..."
 aria-invalid={Boolean(errors.endereco)}
 {...register("endereco")}
 />
 </FormField>

 <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
 <FormField
 label="Número"
 htmlFor="numero"
 required
 error={errors.numero?.message}
 >
 <Input
 id="numero"
 inputMode="numeric"
 autoComplete="address-line2"
 placeholder="123"
 aria-invalid={Boolean(errors.numero)}
 {...register("numero")}
 />
 </FormField>

 <FormField
 label="Complemento (opcional)"
 htmlFor="complemento"
 error={errors.complemento?.message}
 >
 <Input
 id="complemento"
 placeholder="Apto, bloco, casa..."
 aria-invalid={Boolean(errors.complemento)}
 {...register("complemento")}
 />
 </FormField>
 </div>

 <FormField
 label="Bairro"
 htmlFor="bairro"
 required
 error={errors.bairro?.message}
 >
 <Input
 id="bairro"
 placeholder="Seu bairro"
 aria-invalid={Boolean(errors.bairro)}
 {...register("bairro")}
 />
 </FormField>

 <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr]">
 <FormField
 label="Cidade"
 htmlFor="cidade"
 required
 error={errors.cidade?.message}
 >
 <Input
 id="cidade"
 autoComplete="address-level2"
 placeholder="Sua cidade"
 aria-invalid={Boolean(errors.cidade)}
 {...register("cidade")}
 />
 </FormField>

 <FormField
 label="Estado"
 htmlFor="estado"
 required
 error={errors.estado?.message}
 >
 <Controller
 control={control}
 name="estado"
 render={({ field, fieldState }) => (
 <Select
 value={field.value}
 onValueChange={field.onChange}
 >
 <SelectTrigger
 id="estado"
 className="h-11 w-full rounded-xl bg-card"
 aria-invalid={Boolean(fieldState.error)}
 >
 <SelectValue placeholder="UF" />
 </SelectTrigger>
 <SelectContent position="popper" className="max-h-72">
 {ESTADOS.map((estado) => (
 <SelectItem key={estado.uf} value={estado.uf}>
 {estado.uf} — {estado.nome}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 )}
 />
 </FormField>
 </div>
 </div>
 ) : null}

 {step === 2 ? (
 <div className="space-y-4">
 <FormField
 label="Senha"
 htmlFor="senha"
 required
 error={errors.senha?.message}
 >
 <PasswordInput
 id="senha"
 autoComplete="new-password"
 placeholder="Crie uma senha forte"
 aria-invalid={Boolean(errors.senha)}
 {...register("senha")}
 />
 </FormField>

 <div>
 <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
 {[1, 2, 3, 4].map((index) => (
 <span
 key={index}
 className={cn(
 "h-1.5 rounded-full transition-colors",
 index <= passwordScore
 ? strengthMeta.color
 : "bg-border",
 )}
 />
 ))}
 </div>
 <div className="mt-2 flex items-center justify-between gap-2">
 <p className="text-[11px] text-muted-foreground">
 {passwordScore > 0
 ? `Força da senha: ${strengthMeta.label}`
 : "Use 8+ caracteres com maiúscula, minúscula e número."}
 </p>
 </div>
 <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
 {passwordChecks.map((check) => (
 <li
 key={check.label}
 className={cn(
 "flex items-center gap-1.5 text-[11px]",
 check.ok
 ? "text-emerald-700"
 : "text-muted-foreground",
 )}
 >
 {check.ok ? (
 <Check className="size-3" aria-hidden="true" />
 ) : (
 <Circle className="size-2.5" aria-hidden="true" />
 )}
 {check.label}
 </li>
 ))}
 </ul>
 </div>

 <FormField
 label="Confirmar senha"
 htmlFor="confirmar_senha"
 required
 error={errors.confirmar_senha?.message}
 >
 <PasswordInput
 id="confirmar_senha"
 autoComplete="new-password"
 placeholder="Repita a senha"
 aria-invalid={Boolean(errors.confirmar_senha)}
 {...register("confirmar_senha")}
 />
 </FormField>

 <Controller
 control={control}
 name="aceite_termos"
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
 id="aceite_termos"
 checked={Boolean(field.value)}
 onCheckedChange={(checked) =>
 field.onChange(checked === true)
 }
 aria-invalid={Boolean(fieldState.error)}
 className="mt-0.5"
 />
 <label
 htmlFor="aceite_termos"
 className="text-xs leading-relaxed text-muted-foreground"
 >
 Li e concordo com os{" "}
 <Link
 href="/termos"
 target="_blank"
 rel="noopener noreferrer"
 className="font-semibold text-brand-700 hover:underline"
 >
 Termos de Uso
 </Link>{" "}
 e a{" "}
 <Link
 href="/privacidade"
 target="_blank"
 rel="noopener noreferrer"
 className="font-semibold text-brand-700 hover:underline"
 >
 Política de Privacidade
 </Link>
 . Autorizo o tratamento dos meus dados pessoais para
 as finalidades do programa de indicação, nos termos da
 LGPD.
 </label>
 </div>
 {fieldState.error ? (
 <p
 role="alert"
 className="mt-1.5 text-xs font-medium text-destructive"
 >
 {fieldState.error.message}
 </p>
 ) : null}
 </div>
 )}
 />

 <p className="flex items-start gap-2 rounded-xl bg-brand-50/70 p-3 text-[11px] leading-relaxed text-brand-900">
 <ShieldCheck
 className="mt-0.5 size-4 shrink-0 text-brand-600"
 aria-hidden="true"
 />
 Seu CPF é armazenado criptografado e exibido de forma mascarada
 nas telas da plataforma.
 </p>
 </div>
 ) : null}
 </div>

 <div className="mt-4 flex items-center gap-3">
 {step > 0 ? (
 <Button
 type="button"
 variant="outline"
 size="lg"
 onClick={() => {
 setStep((current) => Math.max(current - 1, 0));
 window.scrollTo({ top: 0, behavior: "smooth" });
 }}
 disabled={isPending}
 >
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar
 </Button>
 ) : null}

 {step < STEPS.length - 1 ? (
 <Button
 type="button"
 size="lg"
 className="flex-1"
 onClick={goToNextStep}
 disabled={isPending}
 >
 Continuar
 <ArrowRight className="size-4" aria-hidden="true" />
 </Button>
 ) : (
 <div className="space-y-3">
 {configured ? (
 <div className="flex justify-center">
 <Turnstile
 siteKey={
 process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
 "1x00000000000000000000AA"
 }
 onSuccess={(token) => setTurnstileToken(token)}
 onError={() => setTurnstileToken(null)}
 onExpire={() => setTurnstileToken(null)}
 />
 </div>
 ) : null}

 <Button
 type="submit"
 size="lg"
 className="flex-1"
 disabled={!configured || isPending}
 >
 {isPending ? (
 <>
 <Loader2
 className="size-4 animate-spin"
 aria-hidden="true"
 />
 Criando conta...
 </>
 ) : (
 <>
 {configured ? "Criar minha conta" : "Conexão pendente"}
 {configured ? (
 <Check className="size-4" aria-hidden="true" />
 ) : null}
 </>
 )}
 </Button>
 </div>
 )}
 </div>
 </form>

 <p className="text-center text-xs text-muted-foreground">
 Já tem uma conta?{" "}
 <Link
 href="/login"
 className="font-semibold text-brand-700 hover:underline"
 >
 Entrar
 </Link>
 </p>
 </div>
 </div>
 );
}
