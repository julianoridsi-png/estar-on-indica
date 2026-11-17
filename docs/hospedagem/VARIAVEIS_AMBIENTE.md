# Variáveis de Ambiente — ESTAR ON INDICA

## Obrigatórias (públicas, no navegador)
| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (publishable). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Alias da anon key (fallback). |
| `NEXT_PUBLIC_SITE_URL` | URL pública da aplicação (usada em redirects). |

## Opcionais
Nenhuma variável privada (service role) é usada. Toda a segurança está no RLS do Supabase.

## Onde configurar
- **Local:** `.env.local` (não versionado).
- **Cloudflare Workers:** Painel → Workers → estar-on-indica → Settings → Variables, ou `wrangler secret put`.
- **Local (wrangler dev):** `.dev.vars` (não versionado).

## Regras
- Nunca versionar `.env.local` ou `.dev.vars`.
- Nunca expor service role key no frontend.
- Usar apenas a anon/publishable key no navegador.