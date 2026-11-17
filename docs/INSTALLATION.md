# Instalação — ESTAR ON INDICA

## Pré-requisitos

- Node.js 20+ (LTS). No ambiente atual: `C:\Users\JulianoSilva\AppData\Local\Programs\nodejs`.
- npm 10+.
- Conta no Supabase (projeto criado).
- VS Code (recomendado).

## Passos

1. Clone/baixe o repositório e entre na pasta `estar-on-indica`.
2. Instale dependências:
   ```bash
   npm install
   ```
3. Crie `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-ANON-KEY
   ```
   Não use a `service_role` key no frontend.
4. Execute as migrations `0001..0007` no SQL Editor do Supabase (ver `docs/SETUP_SUPABASE.md`).
5. Promova o primeiro admin:
   ```sql
   update public.profiles set tipo_usuario='admin' where email='seu-email@exemplo.com';
   ```
6. Inicie o dev server:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

## Comandos úteis

```bash
npm run typecheck   # next typegen + tsc
npm run lint        # eslint
npm run build       # build de produção
npm run start       # servir build
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anônima (pública). |

Sem essas variáveis o app exibe telas de configuração, sem quebrar.