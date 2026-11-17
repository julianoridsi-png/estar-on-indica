# Banco de dados

As migrations são executadas manualmente no **SQL Editor** do Supabase, em ordem. Não há Supabase CLI ou Docker neste ambiente.

| Ordem | Arquivo | Depende de |
| --- | --- | --- |
| 1 | `migrations/0001_extensions_enums_cpf.sql` | — |
| 2 | `migrations/0002_tables_triggers.sql` | 0001 |
| 3 | `migrations/0003_rpc_functions.sql` | 0001, 0002 |
| 4 | `migrations/0004_rls_grants.sql` | 0001–0003 |
| 5 | `migrations/0005_storage_branding.sql` | 0001–0004 |
| 6 | `migrations/0006_pix_referrals.sql` | 0001–0005 |
| 7 | `migrations/0007_admin_control.sql` | 0001–0006 |

## Cuidados

- Não execute um arquivo fora de ordem.
- Não altere o nome do segredo `estar_on_cpf_key` sem atualizar as funções.
- Não conceda `EXECUTE` das funções do schema `private` para `anon` ou `authenticated`, exceto as helpers de RLS (`tipo_usuario_atual`, `is_admin`, `is_staff`).
- Não conceda acesso direto às tabelas `profile_sensitive` ou `referral_sensitive`.
- Não crie políticas que usem `service_role`.
- A `service_role` key nunca deve ir para o frontend.

## Após executar

1. Confira RLS ativo:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

2. Confira a configuração pública:

```sql
select * from public.settings where id = 1;
```

3. Confira a chave do Vault (sem exibir o segredo):

```sql
select name, description, created_at
from vault.secrets
where name = 'estar_on_cpf_key';
```

4. Crie a primeira conta pelo site e promova o admin:

```sql
update public.profiles
set tipo_usuario = 'admin'
where email = 'seu-email@exemplo.com';
```

O guia completo está em [`../docs/SETUP_SUPABASE.md`](../docs/SETUP_SUPABASE.md).

## Estrutura

- `profiles`: dados cadastrais não sensíveis e papel do usuário.
- `profile_sensitive`: CPF cifrado, hash HMAC e telefone.
- `referrals`: indicações.
- `referral_sensitive`: CPF cifrado do indicado.
- `referral_history`: histórico de status.
- `rewards`: recompensas.
- `payout_accounts`: chaves PIX criptografadas dos indicadores.
- `campaigns`: campanhas.
- `settings`: configurações públicas da marca.
- `consents`: consentimentos LGPD.
- `audit_logs`: auditoria.
- `notifications`: avisos internos.

## Convenções

- Enums em português, alinhados ao domínio.
- Timestamps em `timestamptz`.
- `created_at`/`updated_at` em todas as entidades mutáveis.
- Funções privilegiadas em `private` e com `search_path = ''`.
- RPCs públicas com `revoke ... from public` e `grant` explícito.
- Nenhum dado fictício é inserido pelas migrations. Apenas a linha de configuração `settings.id = 1`.
