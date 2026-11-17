# Configuração do Supabase

Este guia leva você do zero até o primeiro acesso ao painel. Ele assume que o projeto já foi criado e que o Node.js está instalado.

## 1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um projeto.
2. Escolha uma região próxima do Brasil (por exemplo, São Paulo) e guarde a senha do banco.
3. Aguarde a conclusão do provisionamento.

## 2. Configurar a autenticação

No painel do Supabase, abra **Authentication**:

1. Em **Providers > Email**, mantenha o provedor habilitado.
2. Ative **Confirm email** para produção. Para testes locais, você pode desativar temporariamente, mas o fluxo de confirmação já está implementado.
3. Em **URL Configuration**:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** adicione
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/callback?next=/painel`
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/confirm?next=/painel`
4. Em produção, adicione também:
   - `https://SEU-DOMINIO/auth/callback`
   - `https://SEU-DOMINIO/auth/confirm`
5. Se for usar domínios de preview da Vercel, adicione os padrões correspondentes.

> Os templates de e-mail padrão funcionam com o redirecionamento para `/auth/callback`. Se você personalizar os templates para enviar `token_hash`, use a rota `/auth/confirm` conforme o comentário em `src/app/auth/confirm/route.ts`.

### E-mail em produção

O serviço de e-mail padrão do Supabase é limitado e indicado apenas para testes. Antes de operar com usuários reais, configure um provedor SMTP próprio (Resend, SendGrid, Amazon SES etc.) nas configurações de autenticação do Supabase.

## 3. Preencher as variáveis de ambiente

No painel do Supabase, abra **Project Settings > API** e copie:

- **Project URL**
- **anon public key**

Crie o arquivo `.env.local` na raiz do projeto (ele já existe como modelo e é ignorado pelo Git):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-ANON-KEY
```

Reinicie o servidor depois de alterar o arquivo.

> **Nunca** coloque a `service_role` key no `.env.local` do frontend nem em código executado no navegador. O projeto usa apenas a chave pública e as políticas RLS.

## 4. Executar as migrations

Abra **SQL Editor** no Supabase e execute os arquivos abaixo **nesta ordem**, copiando o conteúdo completo de cada um:

1. `supabase/migrations/0001_extensions_enums_cpf.sql`
2. `supabase/migrations/0002_tables_triggers.sql`
3. `supabase/migrations/0003_rpc_functions.sql`
4. `supabase/migrations/0004_rls_grants.sql`
5. `supabase/migrations/0005_storage_branding.sql`
6. `supabase/migrations/0006_pix_referrals.sql`
7. `supabase/migrations/0007_admin_control.sql`

Cada arquivo é independente no que diz respeito à ordem, mas depende dos anteriores. Não execute fora de ordem.

### O que o arquivo 0001 faz

- Cria as extensões `pgcrypto` e `supabase_vault`.
- Cria o schema privado `private`.
- Cria os enums de perfil, status e recompensa.
- Gera uma chave aleatória de 32 bytes no **Vault**, com o nome `estar_on_cpf_key`.
- Cria as funções internas de normalização, validação, hash e criptografia do CPF.

A chave nunca é escrita no repositório. Para conferir se ela existe:

```sql
select name, description, created_at
from vault.secrets
where name = 'estar_on_cpf_key';
```

Não selecione nem compartilhe `decrypted_secret` fora de um procedimento autorizado.

Se o comando falhar porque a extensão Vault não existe:

1. Abra **Database > Extensions**.
2. Habilite `supabase_vault`.
3. Execute novamente o bloco `do $$ ... $$;` do arquivo 0001.

## 5. Conferir a instalação

No SQL Editor:

```sql
-- Tabelas criadas
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_sensitive',
    'referrals',
    'referral_sensitive',
    'referral_history',
    'rewards',
    'campaigns',
    'settings',
    'audit_logs',
    'notifications',
    'consents'
  )
order by tablename;

-- Configuração inicial da marca
select id, nome_empresa, cor_primaria, cor_secundaria
from public.settings;

-- Funções principais
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'cpf_disponivel',
    'get_indicator_stats',
    'get_admin_stats'
  );
```

Todas as tabelas devem aparecer com `rowsecurity = true`.

## 6. Criar a primeira conta

1. Rode `npm run dev`.
2. Abra `http://localhost:3000/cadastro`.
3. Preencha com um **CPF válido e autorizado por você**. Não use o CPF de outra pessoa.
4. Confirme o e-mail, se a confirmação estiver ativa.
5. Entre com e-mail e senha.

O cadastro cria automaticamente:

- um registro em `auth.users`;
- um perfil em `public.profiles` com papel **indicador**;
- o CPF criptografado e o hash em `public.profile_sensitive`;
- os consentimentos de termos e privacidade em `public.consents`;
- um evento `SIGNUP` em `public.audit_logs`.

## 7. Promover o administrador

Depois de criar a conta, abra o SQL Editor e execute (substitua o e-mail):

```sql
update public.profiles
set tipo_usuario = 'admin'
where email = 'seu-email@exemplo.com';

select id, email, tipo_usuario, status
from public.profiles
where email = 'seu-email@exemplo.com';
```

Saia e entre novamente. O login redireciona administradores para `/admin`.

Para criar um usuário comercial:

```sql
update public.profiles
set tipo_usuario = 'comercial'
where email = 'comercial@exemplo.com';
```

> O papel nunca é aceito a partir do formulário. O trigger de cadastro sempre cria `indicador`; a promoção é feita apenas por SQL no painel do Supabase ou por uma rotina administrativa futura.

## 8. Testar a criptografia do CPF

No SQL Editor, verifique que o CPF não está legível:

```sql
select
  p.email,
  p.cpf_final,
  octet_length(ps.cpf_encrypted) as bytes_criptografados,
  encode(ps.cpf_hash, 'hex') as hash_hmac
from public.profiles p
join public.profile_sensitive ps on ps.profile_id = p.id;
```

O campo `cpf_final` contém somente os dois últimos dígitos. `cpf_encrypted` é um valor binário ilegível. O hash é usado para impedir cadastro duplicado.

A função `private.cpf_decifrar` existe para futuras rotinas administrativas auditadas, mas **não está liberada para a API**. Não conceda execução para `anon` ou `authenticated`.

## 9. Logotipo

O logotipo oficial ainda não foi enviado. O componente `Logo` usa um placeholder com a marca “ESTAR ON Indica”.

Quando o arquivo oficial estiver disponível:

1. O bucket público `branding` já existe (PNG, JPEG ou WebP, até 2 MB).
2. A tela de upload será implementada na próxima etapa.
3. O administrador poderá salvar a URL em `settings.logo_url`.
4. Enquanto isso, não é necessário alterar o código.

## 10. Deploy na Vercel

1. Crie o repositório Git e envie o projeto (o Git ainda não está instalado neste ambiente).
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de ambiente:
   - `NEXT_PUBLIC_SITE_URL=https://seu-dominio.com`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Atualize **Site URL** e **Redirect URLs** no Supabase com o domínio de produção.
5. Faça o deploy.

O build recomendado é o padrão: `npm run build`. A Vercel detecta Next.js automaticamente.

## Problemas comuns

### “CPF_ENCRYPTION_KEY_MISSING”

A chave não existe ou está inacessível. Confira `vault.secrets` e execute novamente o bloco de criação da chave no arquivo 0001. Não crie uma chave manualmente em texto puro.

### “Database error saving new user”

Geralmente indica que:

- as migrations ainda não foram executadas;
- o trigger `on_auth_user_created` não foi criado;
- a chave do Vault está ausente;
- o CPF enviado é inválido.

Abra **Logs > Postgres** no Supabase e procure a mensagem detalhada.

### “permission denied for schema private”

Execute novamente o final do arquivo `0004_rls_grants.sql`, que concede uso do schema privado ao papel `authenticated`.

### Login redireciona para a tela de configuração

As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` não foram carregadas. Confirme o `.env.local` e reinicie o `npm run dev`.

### E-mail de confirmação não chega

- Verifique spam e lixo eletrônico.
- O serviço padrão do Supabase tem limite de envios.
- Confira a **Site URL** e as **Redirect URLs**.
- Em produção, configure SMTP próprio.

### Indicador recebe “Perfil não encontrado”

O usuário existe em `auth.users`, mas o trigger não criou o perfil. Execute as migrations e confira os logs do Postgres. Não crie perfis manualmente sem entender o vínculo com `auth.users`.
