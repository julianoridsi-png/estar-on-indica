import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/shared/lib/validation/cpf";
import { isValidPhone } from "@/shared/lib/validation/phone";
import { PIX_KEY_TYPES, type PixKeyType } from "@/features/pagamentos-pix/services/types";

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const digits = cnpj.split("").map(Number);

  const calculate = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += digits[index] * weights[index];
    }

    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return calculate(12) === digits[12] && calculate(13) === digits[13];
}

export function formatCnpjInput(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  let result = digits.slice(0, 2);

  if (digits.length > 2) result += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) result += `.${digits.slice(5, 8)}`;
  if (digits.length > 8) result += `/${digits.slice(8, 12)}`;
  if (digits.length > 12) result += `-${digits.slice(12, 14)}`;

  return result;
}

export function normalizePixKey(tipo: PixKeyType, value: string): string {
  const trimmed = value.trim();

  switch (tipo) {
    case "cpf":
    case "cnpj":
      return onlyDigits(trimmed);
    case "telefone": {
      const digits = onlyDigits(trimmed);
      return (digits.length === 12 || digits.length === 13) &&
        digits.startsWith("55")
        ? digits.slice(2)
        : digits;
    }
    case "email":
      return trimmed.toLowerCase();
    case "aleatoria":
      return trimmed.toLowerCase();
    default:
      return trimmed;
  }
}

export function isValidPixKey(tipo: PixKeyType, value: string): boolean {
  const key = normalizePixKey(tipo, value);

  if (!key) return false;

  switch (tipo) {
    case "cpf":
      return isValidCpf(key);
    case "cnpj":
      return isValidCnpj(key);
    case "email":
      return (
        key.length <= 254 &&
        /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
          key,
        )
      );
    case "telefone":
      return isValidPhone(key);
    case "aleatoria":
      return (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          key,
        ) || /^[0-9a-f]{32}$/i.test(key)
      );
    default:
      return false;
  }
}

export function formatPixKeyInput(tipo: PixKeyType, value: string): string {
  switch (tipo) {
    case "cpf": {
      const digits = onlyDigits(value).slice(0, 11);
      let result = digits.slice(0, 3);
      if (digits.length > 3) result += `.${digits.slice(3, 6)}`;
      if (digits.length > 6) result += `.${digits.slice(6, 9)}`;
      if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
      return result;
    }
    case "cnpj":
      return formatCnpjInput(value);
    case "telefone": {
      const raw = onlyDigits(value);
      const local =
        (raw.length === 12 || raw.length === 13) && raw.startsWith("55")
          ? raw.slice(2)
          : raw;
      const digits = local.slice(0, 11);
      if (digits.length <= 2) return digits ? `(${digits}` : "";
      const ddd = digits.slice(0, 2);
      const subscriber = digits.slice(2);
      if (subscriber.length <= 4) return `(${ddd}) ${subscriber}`;
      const splitAt = subscriber.length <= 8 ? 4 : 5;
      return `(${ddd}) ${subscriber.slice(0, splitAt)}-${subscriber.slice(splitAt)}`;
    }
    default:
      return value;
  }
}

export const pixFormSchema = z
  .object({
    tipo: z.enum(PIX_KEY_TYPES),
    chave: z
      .string()
      .trim()
      .min(1, { message: "Informe a chave PIX." })
      .max(254, { message: "Chave PIX muito longa." }),
  })
  .superRefine((data, ctx) => {
    if (!isValidPixKey(data.tipo, data.chave)) {
      const messages: Record<PixKeyType, string> = {
        cpf: "CPF inválido. Confira os números.",
        cnpj: "CNPJ inválido. Confira os números.",
        email: "Informe um e-mail válido.",
        telefone: "Telefone inválido. Use DDD + número.",
        aleatoria: "Chave aleatória inválida. Use o formato UUID.",
      };

      ctx.addIssue({
        code: "custom",
        path: ["chave"],
        message: messages[data.tipo],
      });
    }
  });

export type PixFormValues = z.infer<typeof pixFormSchema>;
