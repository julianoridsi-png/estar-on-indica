import { z } from "zod";
import { isValidCpf } from "@/shared/lib/validation/cpf";
import { isValidPhone } from "@/shared/lib/validation/phone";
import { isValidCep } from "@/shared/lib/validation/br";

const emailField = z
 .string()
 .trim()
 .min(1, { message: "Informe seu e-mail." })
 .max(160, { message: "E-mail muito longo." })
 .email({ message: "Informe um e-mail válido." });

const passwordField = z
 .string()
 .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
 .max(72, { message: "A senha deve ter no máximo 72 caracteres." })
 .regex(/[A-Z]/, { message: "Inclua pelo menos uma letra maiúscula." })
 .regex(/[a-z]/, { message: "Inclua pelo menos uma letra minúscula." })
 .regex(/[0-9]/, { message: "Inclua pelo menos um número." });

export const signupFormSchema = z
 .object({
 nome_completo: z
 .string()
 .trim()
 .min(5, { message: "Informe seu nome completo." })
 .max(120, { message: "Nome muito longo." })
 .refine((value) => value.split(/\s+/).length >= 2, {
 message: "Informe nome e sobrenome.",
 })
 .refine((value) => /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(value), {
 message: "Use apenas letras, espaços, apóstrofos e hífens.",
 }),
 cpf: z
 .string()
 .trim()
 .min(1, { message: "Informe seu CPF." })
 .refine(isValidCpf, { message: "CPF inválido. Confira os números." }),
 email: emailField,
 telefone: z
 .string()
 .trim()
 .min(1, { message: "Informe seu telefone." })
 .refine(isValidPhone, {
 message: "Telefone inválido. Use DDD + número.",
 }),
 cep: z
 .string()
 .trim()
 .min(1, { message: "Informe o CEP." })
 .refine(isValidCep, { message: "CEP inválido." }),
 endereco: z
 .string()
 .trim()
 .min(5, { message: "Informe o endereço." })
 .max(160, { message: "Endereço muito longo." }),
 numero: z
 .string()
 .trim()
 .min(1, { message: "Informe o número." })
 .max(20, { message: "Número inválido." }),
 complemento: z
 .string()
 .trim()
 .max(80, { message: "Complemento muito longo." })
 .optional()
 .or(z.literal("")),
 bairro: z
 .string()
 .trim()
 .min(2, { message: "Informe o bairro." })
 .max(80, { message: "Bairro muito longo." }),
 cidade: z
 .string()
 .trim()
 .min(2, { message: "Informe a cidade." })
 .max(80, { message: "Cidade muito longa." }),
 estado: z
 .string()
 .trim()
 .length(2, { message: "Selecione o estado." }),
 senha: passwordField,
 confirmar_senha: z.string().min(1, { message: "Confirme sua senha." }),
 aceite_termos: z.boolean().refine((value) => value === true, {
 message: "É necessário aceitar os termos e a política de privacidade.",
 }),
 turnstileToken: z.string().optional(),
})
 .refine((data) => data.senha === data.confirmar_senha, {
 path: ["confirmar_senha"],
 message: "As senhas não coincidem.",
 });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const loginFormSchema = z.object({
 email: emailField,
 senha: z.string().min(1, { message: "Informe sua senha." }),
 next: z.string().optional(),
 turnstileToken: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
 email: emailField,
});

export const resetPasswordSchema = z
 .object({
 senha: passwordField,
 confirmar_senha: z.string().min(1, { message: "Confirme sua senha." }),
 })
 .refine((data) => data.senha === data.confirmar_senha, {
 path: ["confirmar_senha"],
 message: "As senhas não coincidem.",
 });

/** Campos validados em cada etapa do cadastro. */
export const SIGNUP_STEP_FIELDS = [
 ["nome_completo", "cpf", "email", "telefone"],
 ["cep", "endereco", "numero", "complemento", "bairro", "cidade", "estado"],
 ["senha", "confirmar_senha", "aceite_termos"],
] as const;
