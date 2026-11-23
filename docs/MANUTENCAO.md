# Plano de manutenção — Estar On Indica

## Rotina semanal
- Verificar logs de erro (Cloudflare Workers + Supabase).
- Revisar indicações pendentes e recompensas disponíveis.
- Verificar alertas operacionais no painel admin.

## Rotina mensal
- Revisar migrations pendentes.
- Atualizar dependências (`npm outdated`, `npm audit`).
- Verificar performance (Lighthouse, Cloudflare analytics).
- Revisar políticas RLS e permissões.

## Rotina trimestral
- Auditoria de segurança.
- Revisão de custos externos (Supabase, Cloudflare, provedores).
- Atualização de documentação.
- Teste de backup e recuperação.

## Monitoramento
- Cloudflare Workers analytics (requests, errors, CPU time).
- Supabase dashboard (queries, connections, auth).
- Console do navegador (erros client-side).

## Contatos de suporte
- GitHub Issues: https://github.com/julianoridsi-png/estar-on-indica/issues
- Supabase: https://supabase.com/dashboard
- Cloudflare: https://dash.cloudflare.com
