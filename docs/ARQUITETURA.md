# Arquitetura — Estar On Indica

## Stack

- **Framework:** Next.js 16.4.6 (App Router, Turbopack)
- **UI:** React 19.3, Tailwind CSS v4, shadcn/ui (radix-nova), lucide-react, recharts, sonner
- **Banco:** Supabase (PostgreSQL, Auth, RLS)
- **Hospedagem:** Cloudflare Workers (via OpenNext)
- **Linguagem:** TypeScript 5.x

## Estrutura

```
src/
├── app/           # Rotas (App Router) + layout + globals.css
├── features/      # Módulos por domínio (administracao, autenticacao, dashboard, indicacoes, pagamentos-pix, recompensas, integracoes, automacoes, analytics)
├── services/      # Clientes Supabase (client/server/config)
├── shared/        # Design system (ui/), layout, brand, marketing, lib, providers, pwa
└── proxy.ts       # Middleware de rotas protegidas
```

## Módulos principais

- **autenticacao**: login, cadastro, recuperação, MFA, sessão.
- **indicacoes**: CRUD de indicações, status, timeline.
- **administracao**: users-table, indicators-table, rewards-table, exports, PIX reveal, access report.
- **dashboard**: admin charts (recharts).
- **pagamentos-pix**: chave PIX (criptografada).
- **recompensas**: status badge, rewards engine (pontos, níveis, conquistas).
- **integracoes**: Connect Hub (7 conectores).
- **automacoes**: Automation Studio (fluxos, blocos, simulação).
- **analytics**: Growth Engine + Analytics Studio.

## Rotas

- Site público: `/`, `/termos`, `/privacidade`, `/regras`
- Auth: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/configurar-mfa`
- App (indicador): `/painel`, `/indicacoes`, `/indicacoes/nova`, `/recebimentos`, `/recompensas`
- Admin: `/admin`, `/admin/indicacoes`, `/admin/indicadores`, `/admin/usuarios`, `/admin/recompensas`, `/admin/integracoes`, `/admin/automacoes`, `/admin/analytics`, `/admin/clientes`, `/admin/seguranca`
- API: `/api/v1/health`, `/api/v1/stats`, `/api/v1/indicacoes`, `/api/v1/webhooks/receive`

## Segurança

- RLS por perfil (indicador/comercial/admin).
- `private.is_admin()` / `private.tipo_usuario_atual()` (security definer).
- Cabeçalhos HTTP (X-Frame-Options, HSTS, COOP, Permissions-Policy).
- Rate limiting (in-memory + Supabase Auth).
- Trilha de auditoria (`audit_logs` via trigger).
- Chaves privadas não expostas no frontend.
