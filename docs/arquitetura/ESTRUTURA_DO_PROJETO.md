# Estrutura do Projeto — ESTAR ON INDICA

Mapa do sistema para localizar qualquer funcionalidade rapidamente.

## Visão geral

Aplicação Next.js 16 (App Router) com Supabase. Arquitetura **features-first**: a camada de rotas (`app/`) é fina e delega para módulos em `features/`. Código compartilhado fica em `shared/`. Integrações externas em `services/`.

## Estrutura de diretórios

```
src/
├── app/                          # Rotas (Next.js App Router) — camada fina
│   ├── (public)/                 # Site público (landing, termos, privacidade, regras)
│   ├── (auth)/                   # Login, cadastro, recuperação
│   ├── (app)/                    # Área protegida (requer login)
│   │   ├── painel/               # Painel do indicador
│   │   ├── indicacoes/           # Minhas indicações + nova
│   │   ├── recebimentos/         # Chave PIX e recompensas
│   │   ├── admin/                # Painel do gestor
│   │   └── comercial/            # Área comercial
│   ├── auth/                     # Callbacks do Supabase
│   ├── layout.tsx                # Layout raiz
│   ├── globals.css               # Estilos + paleta (lime/slate)
│   ├── not-found.tsx / error.tsx
│   └── manifest.ts               # PWA
│
├── features/                     # Módulos de negócio (cada um autocontido)
│   ├── autenticacao/             # Login, cadastro, sessão, validação de auth
│   │   ├── components/           # Formulários de auth
│   │   ├── schemas/              # Zod schemas (auth.ts)
│   │   ├── services/             # Server actions, queries, current session
│   │   ├── types/
│   │   └── index.ts              # Barrel (API pública)
│   │
│   ├── indicacoes/               # Indicações (cadastro, status, histórico)
│   │   ├── components/           # ReferralForm, StatusBadge
│   │   ├── schemas/              # referral.ts
│   │   ├── services/             # actions, status, status map
│   │   └── index.ts
│   │
│   ├── pagamentos-pix/           # Chave PIX (cadastro, máscara, reveal)
│   │   ├── components/           # PixForm
│   │   ├── schemas/              # pix.ts
│   │   ├── services/             # actions, types
│   │   └── index.ts
│   │
│   ├── recompensas/              # Recompensas (status, badge)
│   │   ├── components/
│   │   ├── services/
│   │   └── index.ts
│   │
│   ├── administracao/            # Painel gestor (charts, tables, dialogs)
│   │   ├── components/
│   │   ├── services/             # admin actions, types
│   │   └── index.ts
│   │
│   ├── dashboard/                # Gráficos e tipos de dashboard
│   │   ├── components/           # admin-charts
│   │   ├── services/             # types (AdminStats)
│   │   └── index.ts
│   │
│   └── indicadores/              # Gestão de indicadores
│       ├── components/           # IndicatorsTable
│       ├── services/
│       └── index.ts
│
├── shared/                       # Código compartilhado
│   ├── ui/                       # Componentes base (shadcn/ui)
│   ├── layout/                   # AppShell, AppNav, StatCard, SetupScreen
│   ├── layout/site/              # Header/footer do site
│   ├── brand/                    # Logo (EstarOnMark)
│   ├── marketing/                # Páginas legais
│   ├── pwa/                      # Service worker, offline retry
│   ├── providers.tsx             # Providers globais
│   ├── lib/                      # utils, format, errors, settings, site, legal
│   │   └── validation/           # CPF, telefone, CEP, BR (genéricos)
│   ├── hooks/
│   └── types/
│
├── services/                     # Integrações externas
│   └── supabase/                 # client, server, config
│
├── proxy.ts                      # Middleware (proteção de rotas, Next 16)
└── ...
```

## Responsabilidade de cada módulo

| Módulo | Responsabilidade |
|---|---|
| `autenticacao` | Signup, login, logout, recuperação de senha, sessão, perfil. |
| `indicacoes` | Cadastro de indicação, status, histórico, tracking. |
| `pagamentos-pix` | Chave PIX (salvar, remover, mascarar, revelar). |
| `recompensas` | Status e badge de recompensa. |
| `administracao` | Painel gestor: KPIs, filtros, ações administrativas. |
| `dashboard` | Gráficos (Recharts) e tipos de dashboard. |
| `indicadores` | Listagem e gestão de indicadores. |

## Como localizar rapidamente

- **Tela (rota):** `src/app/(app)/.../page.tsx`
- **Componente visual:** `src/features/<módulo>/components/` ou `src/shared/ui/`
- **Regra de negócio / Server Action:** `src/features/<módulo>/services/*actions.ts`
- **Validação (Zod):** `src/features/<módulo>/schemas/` ou `src/shared/lib/validation/`
- **Comunicação com Supabase:** `src/services/supabase/` + RPCs no banco
- **Tipos/Interfaces:** `src/features/<módulo>/types/` ou `services/*.ts`
- **Estilos:** `src/app/globals.css` (paleta) + Tailwind classes nos componentes
- **Documentação:** `docs/`

## Regras de dependência

- `app/` → importa apenas de `features/*/index.ts` e `shared/`.
- `features/*` → pode importar de `shared/` e `services/`, **nunca** de outra feature diretamente.
- `shared/` → não importa de `features/` (evita ciclos).
- `services/` → não importa de `features/`.

## Banco de dados

Migrations em `supabase/migrations/0001..0007`. Ver `docs/DATABASE.md`.

## Segurança

- RLS em todas as tabelas; CPF criptografado via Vault.
- Server Actions validam papel (`indicador`/`comercial`/`admin`) antes de executar.
- Chave PIX completa só via RPC auditada (`admin_revelar_chave_pix`).
- Variáveis de ambiente em `.env.local` (nunca commitadas).