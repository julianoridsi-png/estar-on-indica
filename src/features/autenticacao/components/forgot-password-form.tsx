"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { FormField } from "@/features/autenticacao/components/form-field";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { SetupAlert } from "@/features/autenticacao/components/setup-alert";
import { requestPasswordResetAction } from "@/features/autenticacao/services/actions";
import { forgotPasswordSchema } from "@/features/autenticacao/schemas/auth";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
 const [isPending, startTransition] = useTransition();
 const [serverError, setServerError] = useState<string | null>(null);
 const [sentTo, setSentTo] = useState<string | null>(null);

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<ForgotPasswordValues>({
 resolver: zodResolver(forgotPasswordSchema),
 defaultValues: { email: "" },
 });

 const onSubmit = (values: ForgotPasswordValues) => {
 setServerError(null);

 startTransition(async () => {
 const result = await requestPasswordResetAction(values.email);

 if (result.status === "error") {
 setServerError(result.message);
 toast.error("Não foi possível enviar", {
 description: result.message,
 });
 return;
 }

 setSentTo(values.email);
 toast.success("Solicitação registrada", {
 description: result.message,
 });
 });
 };

 if (sentTo) {
 return (
 <div className="animate-rise text-center">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
 <MailCheck className="size-8" aria-hidden="true" />
 </div>
 <h1 className="mt-6 font-heading text-2xl font-bold text-ink">
 Verifique seu e-mail
 </h1>
 <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
 Se <strong className="text-foreground">{sentTo}</strong> estiver
 cadastrado, você receberá um link para redefinir sua senha. O link
 expira em pouco tempo por segurança.
 </p>
 <div className="mt-7 space-y-3">
 <Button asChild size="lg" className="w-full">
 <Link href="/login">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar para o login
 </Link>
 </Button>
 <Button
 type="button"
 variant="ghost"
 className="w-full"
 onClick={() => setSentTo(null)}
 >
 Usar outro e-mail
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="animate-rise">
 <div className="mb-8">
 <p className="text-xs font-bold tracking-[0.2em] text-brand-600 uppercase">
 Recuperação de acesso
 </p>
 <h1 className="mt-2 font-heading text-3xl font-bold text-ink">
 Redefinir senha
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 Informe o e-mail da sua conta. Enviaremos um link seguro para criar
 uma nova senha.
 </p>
 </div>

 <div className="space-y-4">
 {!configured ? <SetupAlert compact /> : null}
 <FormErrorAlert message={serverError} />

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
 <FormField
 label="E-mail cadastrado"
 htmlFor="email"
 required
 error={errors.email?.message}
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

 <Button
 type="submit"
 size="lg"
 className="w-full"
 disabled={!configured || isPending}
 >
 {isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 Enviando...
 </>
 ) : (
 <>
 Enviar link de recuperação
 <ArrowRight className="size-4" aria-hidden="true" />
 </>
 )}
 </Button>
 </form>

 <Button asChild variant="ghost" className="w-full">
 <Link href="/login">
 <ArrowLeft className="size-4" aria-hidden="true" />
 Voltar para o login
 </Link>
 </Button>
 </div>
 </div>
 );
}
