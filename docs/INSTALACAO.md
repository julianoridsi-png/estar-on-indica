# Guia de instalação — Estar On Indica

## Pré-requisitos
- Node.js 22+ (LTS)
- npm 10+
- Conta Supabase (projeto configurado)
- Conta Cloudflare (para deploy em Workers)

## Instalação local

1. Clonar o repositório:
   ```bash
   git clone https://github.com/julianoridsi-png/estar-on-indica.git
   cd estar-on-indica
   ```

2. Instalar dependências:
   ```bash
   npm install
   ```

3. Configurar variáveis de ambiente (`.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Executar migrations no Supabase (SQL Editor): arquivos em `supabase/migrations/` na ordem 0001–0020.

5. Rodar em desenvolvimento:
   ```bash
   npm run dev
   ```

6. Acessar: http://localhost:3000

## Deploy (Cloudflare Workers)

1. Configurar secrets no GitHub Actions (SUPABASE_URL, SUPABASE_ANON_KEY, CLOUDFLARE_API_TOKEN).
2. Push para `main` → deploy automático.
3. Configurar `NEXT_PUBLIC_SITE_URL` nas variáveis do Worker (produção).

## Verificação pós-deploy
- Acessar a URL de produção.
- Testar login, cadastro, criação de indicação.
- Verificar console do navegador (sem erros).
- Confirmar que as migrations foram executadas no Supabase.
