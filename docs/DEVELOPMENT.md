# Desenvolvimento — ESTAR ON INDICA

## Como localizar arquivos

- Páginas: `src/app/(site)`, `(auth)`, `(app)`.
- Componentes reutilizáveis: `src/components/<area>/`.
- UI base (shadcn): `src/components/ui/`.
- Lógica de negócio: `src/lib/<domínio>/` (actions, types, status).
- Validação: `src/lib/validation/`.
- Supabase: `src/lib/supabase/`.
- Migrations: `supabase/migrations/`.

## Como adicionar uma funcionalidade

1. Defina tipos em `src/lib/<domínio>/types.ts`.
2. Crie server actions em `src/lib/<domínio>/actions.ts` (com `"use server"`).
3. Crie a página em `src/app/(app)/.../page.tsx` (Server Component).
4. Extraia componentes interativos para `src/components/<area>/` com `"use client"`.
5. Adicione RPC/migration se precisar de lógica no banco.
6. Atualize `app-nav.tsx` e o proxy se for rota protegida.
7. Rode `npm run typecheck && npm run lint && npm run build`.

## Convenções

- Componentes: PascalCase; arquivos: kebab-case.
- Server Components por padrão; `"use client"` apenas quando necessário.
- Não coloque lógica de negócio em componentes de UI.
- Trate erros com `friendlyDbError` e toasts.
- Sem dados fictícios; estados vazios explícitos.

## Padrões de código

- ESLint + TypeScript strict.
- Imports organizados (externos, internos, relativos).
- Comentários em PT-BR, focados em regras de negócio.

## Fluxo de dados

- Server Component lê do Supabase via `createClient()` (server).
- Mutação via Server Action → RPC → revalidatePath.
- Client Component gerencia estado de UI (formulários, dialogs, filtros).