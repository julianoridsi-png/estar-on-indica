# Estar On Indica

Plataforma de indicação da **Estar On Internet**. O projeto reúne o site público, o cadastro de indicadores, o painel do indicador e a área protegida da equipe (comercial e administração).

> **Status:** Etapa 2 concluída — identidade visual do logo, PIX, painel administrativo interativo e recompensas.

## Stack

- **Next.js 16.4** (App Router, React 19, TypeScript)
- **Tailwind CSS 4** + **shadcn/ui** + **Lucide**
- **Supabase** (Auth, PostgreSQL, Storage)
- **React Hook Form** + **Zod**
- **Recharts** (reservado para os gráficos das próximas etapas)
- **PWA** com manifest, service worker e página offline
- Preparado para **Vercel**

## O que já está implementado

- Landing page institucional, página de regras, termos e política de privacidade/LGPD.
- Cadastro em etapas com validação de CPF, telefone, CEP (ViaCEP) e aceite de termos.
- Login, logout, confirmação de e-mail, recuperação e redefinição de senha.
- Proteção de rotas por sessão e por perfil (`indicador`, `comercial`, `admin`).
- Painel do indicador com totais reais e indicações recentes (somente leitura).
- Painel administrativo com totais, distribuição por status e indicações recentes (somente leitura).
- Banco de dados com migrations versionadas, RLS, trilha de auditoria, histórico de status e consentimentos.
- CPF criptografado com AES-256 no banco, hash HMAC para unicidade e exibição mascarada.
- PWA com ícones placeholder e tela offline.

### Ainda não implementado (próximas etapas)

- Cadastro de novas indicações pelo indicador.
- Gestão completa de indicações e mudança de status pela equipe.
- Gestão de recompensas e campanhas.
- Upload do logotipo oficial e tela de configurações.
- Gráficos, notificações, exportações e fluxos de direitos LGPD.
- Deploy em produção (Git/Vercel).

## Pré-requisitos

- **Node.js 20+** (o ambiente atual usa Node 26 LTS).
- Conta no [Supabase](https://supabase.com).
- Nenhuma credencial real está incluída no projeto.

## Como rodar

```bash
npm install
```

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-ANON-KEY
```

Depois:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> Sem as variáveis do Supabase, o site continua navegável e as telas autenticadas mostram instruções de configuração. Nada quebra com erro técnico.

## Configuração do Supabase

O passo a passo completo está em [`docs/SETUP_SUPABASE.md`](docs/SETUP_SUPABASE.md). Resumo:

1. Crie um projeto no Supabase.
2. Configure as URLs de autenticação.
3. Execute as migrations de `supabase/migrations` **em ordem** no SQL Editor.
4. Preencha `.env.local`.
5. Crie sua conta pelo site.
6. Promova a conta para administrador com o SQL indicado na documentação.

### Migrations

| Arquivo | Conteúdo |
| --- | --- |
| `0001_extensions_enums_cpf.sql` | Extensões, schema privado, enums, Vault e criptografia de CPF |
| `0002_tables_triggers.sql` | Tabelas, índices, histórico, auditoria e triggers |
| `0003_rpc_functions.sql` | RPCs de CPF, painel do indicador e painel administrativo |
| `0004_rls_grants.sql` | Privilégios mínimos e políticas RLS |
| `0005_storage_branding.sql` | Bucket de identidade visual e políticas de upload |

## Scripts

```bash
npm run dev        # ambiente de desenvolvimento
npm run build      # build de produção
npm run start      # servir o build
npm run lint       # ESLint
npm run typecheck  # gera tipos de rota e valida o TypeScript
```

## Estrutura

```
src/
  app/
    (site)/          # landing, regras, termos, privacidade
    (auth)/          # login, cadastro, recuperação de senha
    (app)/           # área autenticada: painel e admin
    auth/            # callback e confirmação do Supabase
    sem-acesso/      # fallback para perfil ausente ou sem permissão
  components/
    app/             # shell autenticado, cards, tela de setup
    auth/            # formulários e componentes de autenticação
    brand/           # logotipo (placeholder até o upload oficial)
    marketing/       # seções e páginas legais
    referrals/       # badge de status
    site/            # cabeçalho e rodapé públicos
    ui/              # componentes shadcn/ui
  lib/
    auth/            # sessão, perfil e server actions
    dashboard/       # contratos dos RPCs e tipos
    referrals/       # status e jornada da indicação
    supabase/        # clientes browser/server e guarda de configuração
    validation/      # CPF, telefone, CEP, UF e schemas Zod
supabase/
  migrations/        # schema versionado do PostgreSQL
docs/
  SETUP_SUPABASE.md
  CHECKLIST_TESTE.md
  ARQUITETURA.md
  LGPD_SEGURANCA.md
```

## Segurança e LGPD

- O **CPF completo** fica criptografado em `profile_sensitive` e `referral_sensitive`.
- A API não expõe o CPF cifrado nem o hash; as telas mostram apenas `***.***.***-12`.
- A chave de criptografia é gerada no **Supabase Vault** e nunca fica no repositório.
- RLS protege todas as tabelas; indicadores só veem os próprios dados.
- Recompensas são visíveis apenas para o indicador dono e para administradores.
- Alterações relevantes geram registros em `audit_logs`.
- Termos e política aceitos no cadastro são registrados em `consents`.

Leia [`docs/LGPD_SEGURANCA.md`](docs/LGPD_SEGURANCA.md) antes de colocar dados reais em produção.

## Próxima etapa

Após validar a Etapa 1, a Etapa 2 prevê:

1. Cadastro e acompanhamento de indicações pelo indicador.
2. Gestão de indicações e histórico de status pela equipe.
3. Recompensas, campanhas e relatórios.
4. Upload do logotipo e configurações da marca.
5. Gráficos e notificações.

Nenhuma etapa é avançada automaticamente sem autorização.

## Estrutura do projeto (apos refatoracao)

A organizacao segue o padrao features-first. Veja o mapa completo em docs/arquitetura/ESTRUTURA_DO_PROJETO.md e docs/MAPA_PROJETO.md.

Resumo:
- src/app/ - rotas (camada fina).
- src/features/ - modulos de negocio.
- src/shared/ - UI base, layout, utilitarios, validacoes genericas.
- src/services/ - integracoes (Supabase).
- src/proxy.ts - middleware de protecao de rotas.
- supabase/migrations/ - banco de dados (0001 a 0007).
