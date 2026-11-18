# Auditoria Técnica — ESTAR ON INDICA

**Data:** 18/11/2026
**Versão analisada:** commit `9634ca7` + alterações locais
**URL pública:** https://estar-on-indica.julianoridsi.workers.dev/

---

## 1. Estado atual do projeto

### Stack
- Next.js 16.4.6 (App Router), React 19.3, TypeScript strict.
- Tailwind CSS v4 + shadcn/ui (Radix).
- Supabase (Auth, PostgreSQL, Storage, Vault).
- Cloudflare Workers (hospedagem gratuita, via GitHub Actions).
- Recharts, React Hook Form, Zod, Sonner.

### Estrutura (pós-refatoração features-first)
- `src/app/` — rotas (camada fina).
- `src/features/` — 7 módulos (autenticacao, indicacoes, pagamentos-pix, recompensas, administracao, dashboard, indicadores).
- `src/shared/` — UI base, layout, utilitários, validações genéricas.
- `src/services/` — Supabase client/server/config.
- `supabase/migrations/` — 0001 a 0009.
- `docs/` — 15+ documentos.

### Rotas implementadas
- Públicas: `/`, `/login`, `/cadastro`, `/cadastro/confirmar`, `/recuperar-senha`, `/redefinir-senha`, `/termos`, `/privacidade`, `/regras`, `/offline`.
- Protegidas (indicador): `/painel`, `/indicacoes`, `/indicacoes/nova`, `/recebimentos`.
- Protegidas (staff/admin): `/admin`, `/admin/indicacoes`, `/admin/indicacoes/[id]`, `/admin/indicadores`, `/admin/recompensas`, `/comercial`.
- Sistema: `/sem-acesso`, `/_not-found`.

### Funcionalidades implementadas
- Autenticação completa (signup 3 etapas, login, logout, recuperação, confirmação de e-mail).
- Indicações (cadastro com ViaCEP, CPF opcional, consentimento LGPD).
- Chave PIX criptografada (AES via Vault), máscara, revelação auditada.
- Recompensas (geração automática ao marcar instalado, liberação, pagamento, cancelamento).
- Dashboard admin (KPIs, gráfico mensal, donut de status, top indicadores, ranking).
- Gestão de indicações (filtros, status, histórico, observações).
- Gestão de indicadores (lista, PIX status, reveal).
- Configuração de campanha (valor, prazo).
- RBAC (indicador/comercial/admin).
- Auditoria (audit_logs) e LGPD (consents, termos, privacidade).
- PWA (manifest, service worker, offline).

### Validações de build
- `npm run typecheck` ✅
- `npm run build` ✅
- `npm run cf:build` ✅
- `npm audit` (sem omit): 26 vulnerabilidades (8 moderate, 18 high) — todas em dependências de desenvolvimento (eslint, etc.), não afetam produção.

---

## 2. Lacunas identificadas (vs. requisitos da missão)

### 2.1 Segurança (crítico)
| Item | Status | Observação |
|---|---|---|
| RLS em todas as tabelas | ✅ Implementado | Verificar políticas com `select tablename, rowsecurity`. |
| CPF criptografado | ✅ Implementado | AES via Vault, chave `estar_on_cpf_key`. |
| RBAC no backend | ✅ Implementado | Server Actions + RPCs com `security definer`. |
| Rate limiting | ❌ Ausente | Sem limite de tentativas de cadastro/login. |
| CAPTCHA (Turnstile) | ❌ Ausente | Formulários públicos sem proteção contra bots. |
| MFA para admin | ❌ Ausente | Supabase MFA não configurado. |
| Expiração de sessão | ⚠️ Parcial | Supabase padrão (1h access token). Sem refresh custom. |
| Validação no servidor | ✅ Implementado | Zod + RPCs validam. |
| Sem service_role no frontend | ✅ Confirmado | Apenas anon/publishable key. |
| Logs de auditoria | ✅ Implementado | `audit_logs` com actor, ação, tabela, registro. |

### 2.2 Funcionalidades ausentes
| Item | Status | Prioridade |
|---|---|---|
| CAPTCHA nos formulários | ❌ | Alta |
| Rate limiting (cadastro/login) | ❌ | Alta |
| MFA para gestores | ❌ | Alta |
| Paginação server-side (listas) | ❌ (limit 500) | Média |
| Exportação de relatórios (CSV/Excel) | ❌ | Média |
| Filtros por período/região nos relatórios | ⚠️ Parcial | Média |
| Notificações automáticas (e-mail/WhatsApp) | ❌ | Baixa (estrutura modular a preparar) |
| Testes automatizados | ❌ | Média |
| Ambiente de homologação | ❌ | Baixa |
| CNPJ, endereço empresarial, responsável legal | ⚠️ Configurável | Apenas settings básicos |

### 2.3 Dashboard admin — cobertura
| Indicador | Status |
|---|---|
| Total de indicadores | ✅ |
| Total de indicações | ✅ |
| Pendentes / Em análise | ✅ |
| Aprovadas / Instalados | ✅ |
| Canceladas | ✅ (via status) |
| Recompensas pendentes/disponíveis/pagas | ✅ |
| Taxa de conversão | ⚠️ Parcial (cálculo no frontend) |
| Gráfico por período | ✅ (6 meses) |
| Ranking de indicadores | ✅ (top 5) |
| Filtros por data/bairro/status | ⚠️ Parcial (status + indicador + grupo) |

### 2.4 Segurança administrativa
| Item | Status |
|---|---|
| Rotas protegidas (proxy.ts) | ✅ |
| RBAC no backend (RPCs) | ✅ |
| Auditoria de alterações | ✅ |
| Prevenção de pagamentos duplicados | ✅ (índice único de recompensa ativa) |
| Detecção de autoindicação | ⚠️ Não verificado (sem regra explícita) |
| Detecção de indicações duplicadas (CPF) | ✅ (constraint unique no referral_sensitive) |

---

## 3. Riscos identificados

| Risco | Nível | Mitigação proposta |
|---|---|---|
| Cadastros automatizados (bots) | Alto | Cloudflare Turnstile + rate limiting |
| Força bruta no login | Alto | Rate limiting (Supabase Auth tem proteção básica) |
| Elevação de privilégio | Médio | RBAC já no backend; revisar policies |
| Exposição de dados via URL | Baixo | RLS garante isolamento |
| Indicações duplicadas | Baixo | Constraint unique no CPF |
| Performance com >500 registros | Médio | Paginação server-side |
| Ausência de testes | Médio | Criar testes de integração |

---

## 4. Plano de execução (priorizado)

### Fase 1 — Segurança crítica (alta prioridade)
1. **Cloudflare Turnstile** nos formulários de cadastro e login.
2. **Rate limiting** via Cloudflare WAF (regras gratuitas).
3. **MFA** para admin/comercial (Supabase Auth MFA).
4. Revisar policies RLS com query de auditoria.

### Fase 2 — Funcionalidades comerciais
1. Paginação server-side nas listas (indicadores, indicações, recompensas).
2. Exportação CSV de relatórios.
3. Filtros por período (data inicial/final) no dashboard.
4. Cálculo de taxa de conversão no backend (RPC).

### Fase 3 — Notificações e UX
1. Estrutura modular de notificações (tabela + triggers).
2. Preparar integração com e-mail (Resend/SendGrid) — sem envio automático ainda.
3. Mensagens de feedback mais claras.
4. Otimização mobile (touch targets, spacing).

### Fase 4 — Testes e qualidade
1. Testes unitários para validações (CPF, PIX, referral).
2. Testes de integração para fluxos críticos (signup, indicação, recompensa).
3. Revisão de acessibilidade (a11y).

### Fase 5 — Documentação e produção
1. Atualizar docs com novas features.
2. Configurar ambiente de homologação (branch `staging`).
3. Monitoramento de erros (Sentry ou Cloudflare Logs).

---

## 5. O que já está bem (não mexer)

- RLS ativo em todas as tabelas.
- CPF criptografado via Vault (AES-256).
- Auditoria completa (audit_logs).
- RBAC no backend (Server Actions + RPCs).
- Sem service_role no frontend.
- Build/typecheck/lint passando.
- Hospedagem gratuita (Cloudflare Workers + GitHub Actions).
- Arquitetura features-first organizada.
- Documentação extensa (15+ docs).

---

## 6. Decisões necessárias do usuário

1. **CAPTCHA (Turnstile):** Posso implementar Cloudflare Turnstile (gratuito). Precisa de uma chave de site (pública) — posso gerar no painel Cloudflare.
2. **MFA:** Supabase MFA requer configuração no dashboard. Posso preparar o código.
3. **Notificações por e-mail:** Qual serviço usar? (Resend, SendGrid, Supabase Auth e-mails). Preciso de API key.
4. **Exportação de relatórios:** CSV (simples) ou Excel (requer lib como `exceljs`).
5. **Ambiente de homologação:** Criar branch `staging` no GitHub e worker separado no Cloudflare?

---

## 7. Próximo passo

Aguardando autorização para iniciar a **Fase 1 (Segurança crítica)**. Posso começar pelo Turnstile (CAPTCHA) e rate limiting, que são os itens de maior impacto e menor risco.

**Não fiz nenhuma alteração destrutiva.** O projeto está intacto e funcional na URL pública.