import { z } from "zod";
import { isValidCpf } from "@/shared/lib/validation/cpf";
import { isValidPhone } from "@/shared/lib/validation/phone";
import { isValidCep, isValidUf } from "@/shared/lib/validation/br";

const emailField = z
 .string()
 .trim()
 .min(1, { message: "Informe o e-mail da pessoa indicada." })
 .max(160, { message: "E-mail muito longo." })
 .email({ message: "Informe um e-mail válido." });

export const referralFormSchema = z.object({
 indicado_nome: z
 .string()
 .trim()
 .min(5, { message: "Informe o nome completo da pessoa indicada." })
 .max(160, { message: "Nome muito longo." })
 .refine((value) => value.split(/\s+/).length >= 2, {
 message: "Informe nome e sobrenome.",
 })
 .refine((value) => /^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(value), {
 message: "Use apenas letras, espaços, apóstrofos e hífens.",
 }),
 indicado_cpf: z
 .string()
 .trim()
 .min(1, { message: "Informe o CPF da pessoa indicada." })
 .refine(isValidCpf, { message: "CPF inválido. Confira os números." }),
 indicado_email: emailField,
 indicado_telefone: z
 .string()
 .trim()
 .min(1, { message: "Informe o telefone da pessoa indicada." })
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
 .length(2, { message: "Selecione o estado." })
 .refine(isValidUf, { message: "Selecione um estado válido." }),
 observacoes: z
 .string()
 .trim()
 .max(1000, { message: "Use no máximo 1000 caracteres." })
 .optional()
 .or(z.literal("")),
 consentimento: z.boolean().refine((value) => value === true, {
 message:
 "Confirme que você tem autorização da pessoa indicada para compartilhar os dados.",
 }),
});

export type ReferralFormValues = z.infer<typeof referralFormSchema>;
