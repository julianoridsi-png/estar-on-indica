# Configuração Cloudflare — ESTAR ON INDICA

## Arquivos criados
- `wrangler.jsonc` — configuração do Worker (nome, compatibilidade, assets).
- `open-next.config.ts` — adaptador OpenNext (Next.js → Cloudflare Workers).
- `.dev.vars` — variáveis locais para `wrangler dev` (não versionado).
- `.env.example` — modelo de variáveis (versionado).

## Compatibilidade
- Next.js 16.4.6 suportado pelo `@opennextjs/cloudflare`.
- Middleware (proxy.ts) suportado, mas exibe aviso de experimental. Funciona.
- Imagens: `images.unoptimized = true` (Cloudflare Workers não tem otimização nativa de imagens Next.js). Imagens servidas diretamente.
- Cache: incremental cache desativado (app é dinâmico). ISR não utilizado.

## Limites do plano gratuito
- 100.000 requisições/dia.
- 10 ms de CPU por requisição (Workers Free). Páginas SSR leves passam; operações pesadas podem falhar.
- Sem custo de armazenamento para assets estáticos (Workers Assets).

## Observabilidade
`observability.enabled = true` no wrangler.jsonc ativa logs no painel Cloudflare.