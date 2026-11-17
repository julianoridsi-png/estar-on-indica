# Mapa do projeto — ESTAR ON INDICA

Guia rápido para localizar o código no VS Code. Abra a pasta `estar-on-indica` no VS Code (File → Open Folder).

## Onde está o FRONTEND

```
src/
├── app/                          # Páginas (rotas) da aplicação
│   ├── (site)/                   # Site público: landing, termos, privacidade, regras
│   │   ├── page.tsx              # Página inicial (landing)
│   │   ├── termos/page.tsx
│   │   ├── privacidade/page.tsx
│   │   └── regras/page.tsx
│   ├── (auth)/                   # Autenticação
│   │   ├── login/page.tsx
│   │   ├── cadastro/page.tsx
│   │   ├── recuperar-senha/page.tsx
│   │   └── redefinir-senha/page.tsx
│   ├── (app)/                    # Área protegida (precisa login)
│   │   ├── painel/page.tsx       # Painel do indicador
│   │   ├── indicacoes/           # Minhas indicações + nova
│   │   ├── recebimentos/page.tsx # Chave PIX e recompensas
│   │   └── admin/                # Painel do gestor
│   │       ├── page.tsx          # Dashboard
│   │       ├── indicacoes/       # Gestão de indicações
│   │       ├── indicadores/      # Gestão de indicadores
│   │       └── recompensas/      # Recompensas e campanha
│   ├── layout.tsx                # Layout raiz (fontes, metadata, PWA)
│   ├── globals.css               # Estilos globais + paleta de cores
│   └── not-found.tsx / error.tsx # 404 e erro
│
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # Componentes base (shadcn/ui): Button, Input, Dialog...
│   ├── app/                      # Shell, navegação, cards de estatística
│   ├── auth/                     # Formulários de login/cadastro
│   ├── pix/                      # Formulário de chave PIX
│   ├── referrals/                # Formulário e badges de status de indicação
│   ├── rewards/                  # Badge de status de recompensa
│   ├── admin/                    # Tabelas e gráficos do painel gestor
│   ├── brand/                    # Logo (EstarOnMark)
│   ├── site/                     # Header/footer do site público
│   ├── marketing/                # Páginas legais
│   └── pwa/                      # Service worker, offline
│
├── lib/                          # Lógica e serviços
│   ├── admin/                    # Ações e tipos administrativos
│   ├── auth/                     # Sessão, login, logout, queries
│   ├── payouts/                  # PIX: tipos, ações, validação
│   ├── referrals/                # Status e ações de indicação
│   ├── rewards/                  # Status de recompensa
│   ├── supabase/                 # Clientes Supabase (browser/server/config)
│   ├── validation/               # CPF, telefone, CEP, BR, PIX, referral, auth
│   ├── dashboard/                # Tipos de dashboard
│   ├── format.ts                 # Formatação de moeda, data, número
│   └── errors.ts                 # Tratamento de erros do banco
│
├── proxy.ts                      # Proteção de rotas (middleware)
└── app/manifest.ts               # PWA manifest
```

## Onde está o BACKEND

Este projeto usa **Next.js Server Actions + Supabase (PostgreSQL)**. Não há backend separado.

- **Server Actions** (funções que rodam no servidor): `src/lib/*/actions.ts` (auth, referrals, payouts, admin).
- **Middleware de rotas**: `src/proxy.ts`.
- **Banco de dados**: pasta `supabase/` (migrations SQL).
- **Validação de entrada**: `src/lib/validation/`.

## Onde está o BANCO DE DADOS

```
supabase/
├── README.md                     # Guia do banco
└── migrations/                   # 0001 a 0007 (execute em ordem no SQL Editor)
```

## Documentação

```
docs/
├── README (na raiz)             # Apresentação e instalação
├── SETUP_SUPABASE.md            # Como configurar o Supabase
├── CHECKLIST_TESTE.md           # Roteiro de testes
├── ARQUITETURA.md               # Arquitetura geral
├── LGPD_SEGURANCA.md            # Segurança e LGPD
├── AUDIT.md                     # Auditoria
├── DATABASE.md                  # Estrutura do banco
├── INSTALLATION.md              # Instalação
├── DEVELOPMENT.md               # Como desenvolver
├── API.md                       # Server Actions e RPCs
└── MAPA_PROJETO.md              # Este arquivo
```

## Como rodar no VS Code

1. Abra a pasta `estar-on-indica` no VS Code (File → Open Folder).
2. Terminal → New Terminal.
3. Execute: `npm run dev`
4. Acesse `http://localhost:3000`.

### Atalhos úteis no VS Code
- `Ctrl+P` → buscar arquivo por nome (ex: digite `painel` para abrir o painel).
- `Ctrl+Shift+F` → buscar texto em todo o projeto.
- `Ctrl+B` → mostrar/ocultar a barra lateral de arquivos.

### Dica: cores do tema
A paleta (lime + slate) está em `src/app/globals.css` (variáveis `--brand`, `--ink`).