# Banco de dados — ESTAR ON INDICA

## Visão geral

PostgreSQL (Supabase). Migrations em `supabase/migrations/0001..0007`, executadas manualmente no SQL Editor em ordem.

## Tabelas principais

| Tabela | Descrição |
| --- | --- |
| `profiles` | Dados cadastrais não sensíveis e papel (`indicador`, `comercial`, `admin`). |
| `profile_sensitive` | CPF cifrado (AES via Vault), hash HMAC, telefone. |
| `referrals` | Indicações (indicado, endereço, status, consentimento, datas). |
| `referral_sensitive` | CPF cifrado do indicado. |
| `referral_history` | Histórico de mudanças de status. |
| `rewards` | Recompensas (valor, status, datas). |
| `payout_accounts` | Chave PIX criptografada por indicador. |
| `campaigns` | Campanhas. |
| `settings` | Configurações públicas da marca + valor/prazo da recompensa (linha única `id=1`). |
| `consents` | Consentimentos LGPD. |
| `audit_logs` | Trilha de auditoria. |
| `notifications` | Avisos internos. |

## Relacionamentos

- `referrals.indicator_id` → `profiles.id`.
- `referral_sensitive.referral_id` → `referrals.id`.
- `referral_history.referral_id` → `referrals.id`.
- `rewards.referral_id` → `referrals.id`, `rewards.indicator_id` → `profiles.id`.
- `payout_accounts.profile_id` → `profiles.id` (1:1).
- `settings.updated_by` → `profiles.id`.

## Segurança

- RLS habilitado em todas as tabelas públicas.
- CPF sempre cifrado; exibição apenas dos 2 últimos dígitos (`cpf_final`).
- Chave de criptografia no Vault (`estar_on_cpf_key`), reutilizada para PIX.
- Funções privilegiadas em schema `private`, `search_path = ''`.
- RPCs públicas com `revoke ... from public` e `grant` explícito.

## RPCs públicas relevantes

- `get_indicator_stats()` → jsonb (totais do indicador).
- `get_admin_stats()` → jsonb (totais, `por_mes`, `top_indicadores`, valores de recompensa).
- `get_minha_chave_pix()` → conta PIX mascarada do usuário.
- `salvar_chave_pix(...)`, `remover_chave_pix()`.
- `criar_indicacao(...)`.
- `admin_listar_indicadores()`, `admin_listar_recompensas()`.
- `admin_revelar_chave_pix(p_profile_id)`.
- `admin_atualizar_status_indicacao(...)`, `admin_atualizar_status_recompensa(...)`.
- `admin_atualizar_config_recompensa(...)`, `admin_gerar_recompensas_pendentes()`.

## Convenções

- Enums em português, alinhados ao domínio.
- Timestamps em `timestamptz`.
- `created_at`/`updated_at` em entidades mutáveis.
- Nenhum dado fictício inserido pelas migrations (apenas `settings.id = 1`).