"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/features/autenticacao/components/form-field";
import { PasswordInput } from "@/features/autenticacao/components/password-input";
import { FormErrorAlert } from "@/features/autenticacao/components/form-error-alert";
import { resetPasswordSchema } from "@/features/autenticacao/schemas/auth";
import { updatePasswordAction } from "@/features/autenticacao/services/actions";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ email }: { email: string | null }) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [serverError, setServerError] = useState<string | null>(null);

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<ResetPasswordValues>({
 resolver: zodResolver(resetPasswordSchema),
 defaultValues: { senha: "", confirmar_senha: "" },
 });

 const onSubmit = (values: ResetPasswordValues) => {
 setServerError(null);

 startTransition(async () => {
 const result = await updatePasswordAction(values);

 if (result.status === "error") {
 setServerError(result.message);
 toast.error("Não foi possível alterar a senha", {
 description: result.message,
 });
 return;
 }

 toast.success("Senha alterada com sucesso");
 router.replace(result.redirectTo ?? "/painel");
 router.refresh();
 });
 };

 return (
 <div className="animate-rise">
 <div className="mb-8">
 <p className="text-xs font-bold tracking-[0.2em] text-brand-600 uppercase">
 Segurança da conta
 </p>
 <h1 className="mt-2 font-heading text-3xl font-bold text-ink">
 Crie uma nova senha
 </h1>
 <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
 {email ? (
 <>
 Defina a nova senha da conta{" "}
 <strong className="text-foreground">{email}</strong>.
 </>
 ) : (
 "Defina uma nova senha para sua conta."
 )}
 </p>
 </div>

 <div className="space-y-4">
 <FormErrorAlert message={serverError} />

 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
 <FormField
 label="Nova senha"
 htmlFor="senha"
 required
 error={errors.senha?.message}
 hint="Mínimo de 8 caracteres, com letra maiúscula, minúscula e número."
 >
 <PasswordInput
 id="senha"
 autoComplete="new-password"
 placeholder="Crie uma senha forte"
 aria-invalid={Boolean(errors.senha)}
 {...register("senha")}
 />
 </FormField>

 <FormField
 label="Confirmar nova senha"
 htmlFor="confirmar_senha"
 required
 error={errors.confirmar_senha?.message}
 >
 <PasswordInput
 id="confirmar_senha"
 autoComplete="new-password"
 placeholder="Repita a nova senha"
 aria-invalid={Boolean(errors.confirmar_senha)}
 {...register("confirmar_senha")}
 />
 </FormField>

 <Button type="submit" size="lg" className="w-full" disabled={isPending}>
 {isPending ? (
 <>
 <Loader2 className="size-4 animate-spin" aria-hidden="true" />
 Salvando...
 </>
 ) : (
 <>
 Salvar nova senha
 <ArrowRight className="size-4" aria-hidden="true" />
 </>
 )}
 </Button>
 </form>

 <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[11px] leading-relaxed text-muted-foreground">
 <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
 Por segurança, as outras sessões desta conta serão encerradas após a
 troca da senha.
 </p>

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
