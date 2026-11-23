# Backup e recuperação — Estar On Indica

## Banco de dados (Supabase)
- Backups automáticos diários pelo Supabase (plano Pro).
- Exportação manual via Supabase Dashboard → Database → Backups.
- Para exportação de dados: usar as funções de exportação (CSV/Excel) no painel admin.

## Código e configuração
- Repositório Git (GitHub) — histórico completo de commits.
- Variáveis de ambiente documentadas em `.env.example`.

## Estratégia recomendada
1. Backup diário do banco (Supabase automático).
2. Backup semanal de exportações (CSV/Excel) via painel admin.
3. Versionamento de código via Git (tags para releases).
4. Manter `.env.local` e `.dev.vars` em local seguro (não versionados).

## Recuperação
- Banco: restaurar via Supabase Dashboard (point-in-time recovery no plano Pro).
- Código: `git checkout <tag>` + redeploy.
- Configuração: restaurar variáveis de ambiente no Cloudflare/Supabase.

## Retenção de dados
- Dados de indicações e recompensas: manter por período legal (5 anos recomendado).
- Logs de auditoria: imutáveis, retenção conforme política LGPD.
- Dados de usuários inativos: anonimizar após solicitação LGPD.
