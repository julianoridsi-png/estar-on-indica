/**
 * As funções do banco usam mensagens no formato CODIGO: texto amigável.
 * Extraímos apenas a parte amigável para exibir ao usuário.
 */
export function friendlyDbError(
 message: string | null | undefined,
 fallback: string,
): string {
 if (!message) return fallback;

 const match = message.match(/[A-Z][A-Z_]{2,}:\s*(.+)$/);
 if (match?.[1]) return match[1].trim();

 return fallback;
}
