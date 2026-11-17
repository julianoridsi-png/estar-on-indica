# Manutenção em Produção — ESTAR ON INDICA

## Atualizar a aplicação
1. Edite o código localmente.
2. Rode `npm run typecheck && npm run lint && npm run build`.
3. `npm run cf:build`
4. `npm run cf:deploy`

## Consultar logs
```bash
npx wrangler tail
```
Ou no painel Cloudflare: Workers → estar-on-indica → Logs.

## Identificar erros
- Erros de runtime aparecem nos logs em tempo real.
- Erros de build aparecem no terminal durante `cf:build`.
- Erros de Supabase (RLS, RPC) retornam 401/403 com mensagem `ACESSO_NEGADO` etc.

## Reverter publicação
Painel Cloudflare → Workers → estar-on-indica → Deployments → selecione versão anterior → "Rollback".

## Limites do plano gratuito
- 100.000 req/dia.
- 10 ms CPU por req.
- Sem custo para assets estáticos.