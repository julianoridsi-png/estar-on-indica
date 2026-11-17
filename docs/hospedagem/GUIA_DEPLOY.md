# Guia de Deploy — ESTAR ON INDICA (Cloudflare Workers)

## Pré-requisitos
- Conta Cloudflare (gratuita): https://dash.cloudflare.com/sign-up
- Node.js 20+ (já instalado)
- Projeto Supabase já configurado (migrations 0001-0007 executadas)

## Passos

### 1. Autenticar no Cloudflare (uma vez)
```bash
npx wrangler login
```
Abre o navegador para autorizar. Não compartilhe o token.

### 2. Configurar variáveis de ambiente (secrets)
No painel Cloudflare → Workers → estar-on-indica → Settings → Variables, adicione:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://kctrgakxztznbtzitluy.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_...`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_...`
- `NEXT_PUBLIC_SITE_URL` = URL pública do worker (ex.: `https://estar-on-indica.<subdomain>.workers.dev`)

Ou via CLI:
```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Build
```bash
npm run cf:build
```

### 4. Publicar
```bash
npm run cf:deploy
```

### 5. Configurar Supabase Auth
No Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://estar-on-indica.<subdomain>.workers.dev`
- Redirect URLs: adicione `https://estar-on-indica.<subdomain>.workers.dev/**`

### 6. Testar
Acesse a URL pública e teste: landing, cadastro, login, painel, admin.

## Atualizações futuras
1. `git pull` (ou edite o código).
2. `npm run cf:build`
3. `npm run cf:deploy`

## Reverter
Cloudflare mantém versões anteriores. No painel → Deployments → selecione uma versão anterior → "Rollback".

## Logs
```bash
npx wrangler tail
```
Ou no painel: Workers → estar-on-indica → Logs.