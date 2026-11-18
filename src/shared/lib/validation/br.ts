import { onlyDigits } from "./cpf";

export const ESTADOS = [
 { uf: "AC", nome: "Acre" },
 { uf: "AL", nome: "Alagoas" },
 { uf: "AP", nome: "Amapá" },
 { uf: "AM", nome: "Amazonas" },
 { uf: "BA", nome: "Bahia" },
 { uf: "CE", nome: "Ceará" },
 { uf: "DF", nome: "Distrito Federal" },
 { uf: "ES", nome: "Espírito Santo" },
 { uf: "GO", nome: "Goiás" },
 { uf: "MA", nome: "Maranhão" },
 { uf: "MT", nome: "Mato Grosso" },
 { uf: "MS", nome: "Mato Grosso do Sul" },
 { uf: "MG", nome: "Minas Gerais" },
 { uf: "PA", nome: "Pará" },
 { uf: "PB", nome: "Paraíba" },
 { uf: "PR", nome: "Paraná" },
 { uf: "PE", nome: "Pernambuco" },
 { uf: "PI", nome: "Piauí" },
 { uf: "RJ", nome: "Rio de Janeiro" },
 { uf: "RN", nome: "Rio Grande do Norte" },
 { uf: "RS", nome: "Rio Grande do Sul" },
 { uf: "RO", nome: "Rondônia" },
 { uf: "RR", nome: "Roraima" },
 { uf: "SC", nome: "Santa Catarina" },
 { uf: "SP", nome: "São Paulo" },
 { uf: "SE", nome: "Sergipe" },
 { uf: "TO", nome: "Tocantins" },
] as const;

export type EstadoUF = (typeof ESTADOS)[number]["uf"];

export const UF_VALUES = ESTADOS.map((estado) => estado.uf);

export function isValidUf(value: string): boolean {
 return UF_VALUES.includes(value as EstadoUF);
}

export function formatCepInput(value: string): string {
 const digits = onlyDigits(value).slice(0, 8);
 if (digits.length <= 5) return digits;
 return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function isValidCep(value: string): boolean {
 return onlyDigits(value).length === 8;
}
