# Auditoria — ESTAR ON INDICA

## 1. Tecnologias utilizadas

- **Framework web:** Next.js 16.4.6 (App Router, Server Components, Server Actions, Proxy/Middleware).
- **Linguagem:** TypeScript (strict).
- **Estilo:** Tailwind CSS v4 + shadcn/ui (Radix) + Lucide.
- **Banco/Auth/Storage:** Supabase (PostgreSQL, Auth, Storage, Vault).
- **Gráficos:** Recharts.
- **Formulários/validação:** React Hook Form + Zod.
- **Notificações:** Sonner.
- **Datas:** date-fns (pt-BR).
- **PWA:** manifest + service worker + página offline.
- **Deploy alvo:** Vercel.

## 2. Estrutura atual (resumo)

```
src/
  app/
    (site)/        # landing, termos, privacidade, regras
    (auth)/        # login, cadastro, recuperação
    (app)/         # área autenticada (painel, indicacoes, recebimentos, admin/*)
    auth/*         # callbacks
  components/
    admin/         # painel administrativo
    auth/          # formulários de autenticação
    pix/           # formulário de chave PIX
    referrals/     # formulários e badges de status
    rewards/       # badge de recompensa
    ui/            # shadcn/ui
    ...
  lib/
    admin/         # actions e tipos administrativos
    auth/          # sessão, queries, actions
    payouts/       # PIX: types, actions, validação
    referrals/     # status e actions
    rewards/       # status
    supabase/      # client/server/config
    validation/    # CPF, telefone, CEP, BR, PIX, referral, auth
    dashboard/     # tipos de dashboard
    errors.ts      # friendlyDbError
  proxy.ts         # proteção de rotas
supabase/
  migrations/      # 0001..0007
docs/
```

## 3. Funcionalidades existentes

- Autenticação (signup 3 etapas, login, logout, recuperação/reset, confirmação de e-mail).
- Área do indicador: painel, lista/criação de indicações, chave PIX, recompensas.
- Área administrativa: dashboard interativo, gestão de indicações, indicadores, recompensas, configuração de campanha.
- Auditoria, LGPD, RLS, CPF criptografado.
- PWA/offline, páginas legais, 404/error.

## 4. Problemas identificados (e corrigidos)

- Mistura de responsabilidades em arquivos grandes → separado em `lib/*` por domínio.
- Ausência de fluxo PIX → tabela `payout_accounts` + RPCs.
- Ausência de automação de recompensa → trigger ao marcar `instalado`.
- Dashboard sem interatividade → gráficos Recharts + filtros.
- Cores genéricas → paleta lime/slate alinhada ao logo.
- `libpg-query` extraneous → removido.

## 5. Melhorias recomendadas

- Testes automatizados (unitários para validações e E2E para fluxos críticos).
- Paginação server-side nas listas (hoje limit 500).
- Notificações por e-mail ao indicador em mudanças de status (infra de e-mail a definir).

## 6. Plano de reorganização

Já aplicado: domínios separados em `lib/`, componentes por área, migrations numeradas, documentação em `docs/`. Próximos passos dependem de credenciais Supabase para validação runtime.