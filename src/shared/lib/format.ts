import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(value: string | Date): string {
 const date = typeof value === "string" ? new Date(value) : value;
 if (Number.isNaN(date.getTime())) return "—";
 return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTimeBR(value: string | Date): string {
 const date = typeof value === "string" ? new Date(value) : value;
 if (Number.isNaN(date.getTime())) return "—";
 return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatCurrencyBRL(value: number): string {
 return new Intl.NumberFormat("pt-BR", {
 style: "currency",
 currency: "BRL",
 }).format(value);
}

export function formatNumberBR(value: number): string {
 return new Intl.NumberFormat("pt-BR").format(value);
}
