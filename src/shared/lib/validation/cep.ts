import { onlyDigits } from "@/shared/lib/validation/cpf";

export type CepAddress = {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
};

/**
 * Consulta gratuita do ViaCEP usada apenas para facilitar o preenchimento.
 * O usuário pode corrigir todos os campos manualmente.
 */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data: {
      erro?: boolean;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    } = await response.json();

    if (data.erro) return null;

    return {
      endereco: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      estado: data.uf ?? "",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
