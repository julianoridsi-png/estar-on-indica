# Banco de dados — Estar On Indica

## Tecnologia
Supabase (PostgreSQL) com Row Level Security (RLS).

## Tabelas principais

- `profiles` — perfil do usuário (nome, email, CPF criptografado, tipo_usuario, status, cidade, estado).
- `referrals` — indicações (indicado_nome, cpf_final, status, datas, indicator_id).
- `rewards` — recompensas (valor, status, datas, pix).
- `payout_accounts` — chaves PIX (criptografadas, mascaradas).
- `campaigns` — campanhas (datas, valores).
- `settings` — configurações do site.
- `audit_logs` — trilha de auditoria imutável.

## Tabelas da versão 4.0
- `organizacoes` — organizações (multi-tenant prep).
- `integracoes` + `integration_events` — Connect Hub.
- `automation_flows`, `automation_nodes`, `automation_edges`, `automation_executions`, `automation_logs` — Automation Studio.
- `niveis`, `conquistas`, `participante_pontos`, `participante_conquistas`, `metas_participante` — Rewards Engine.

## Migrations
Arquivos em `supabase/migrations/` (0001–0020). Executar na ordem no SQL Editor.

## RLS
- Policies por perfil: `profiles_update_own`, `profiles_update_admin`.
- Funções auxiliares: `private.is_admin()`, `private.tipo_usuario_atual()`, `private.organizacao_atual()`.
- Acesso a dados sensíveis apenas por funções `security definer` auditadas.

## Segurança
- CPF armazenado criptografado (libsodium).
- Chave PIX mascarada; revelação auditada (admin only).
- RLS ativo em todas as tabelas.
- Triggers de auditoria em profiles, referrals, rewards, campaigns, settings.
