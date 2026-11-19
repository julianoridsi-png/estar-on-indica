# Auditoria e Plano de Evolução — ESTAR ON INDICA 2.0

**Data:** 19/11/2026
**Versão analisada:** commit `5473a80` + alterações locais
**URL pública:** https://estar-on-indica.julianoridsi.workers.dev/

---

## 1. Diagnóstico da arquitetura atual

### Stack
- Next.js 16.4.6 (App Router), React 19.3, TypeScript strict.
- Tailwind CSS v4 + shadcn/ui (Radix).
- Supabase (Auth, PostgreSQL, Storage, Vault).
- Cloudflare Workers (hospedagem gratuita, CI/CD via GitHub Actions).
- Recharts, React Hook Form, Zod, Sonner, exceljs, @marsidev/react-turnstile.

### Estrutura (features-first)
- `src/app/` — rotas (camada fina).
- `src/features/` — 7 módulos (autenticacao, indicacoes, pagamentos-pix, recompensas, administracao, dashboard, indicadores).
- `src/shared/` — UI base, layout, utilitários, validações genéricas.
- `src/services/` — Supabase client/server/config.
- `supabase/migrations/` — 0001 a 0010.
- `ESTAR_ON_INDICA_2.0/` — estrutura de documentação e navegação.

### Rotas implementadas
- Públicas: `/`, `/login`, `/cadastro`, `/cadastro/confirmar`, `/recuperar-senha`, `/redefinir-senha`, `/termos`, `/privacidade`, `/regras`, `/offline`, `/apresentacao.html`.
- Protegidas (indicador): `/painel`, `/indicacoes`, `/indicacoes/nova`, `/recebimentos`.
- Protegidas (staff/admin): `/admin`, `/admin/indicacoes`, `/admin/indicacoes/[id]`, `/admin/indicadores`, `/admin/recompensas`, `/comercial`, `/configurar-mfa`.
- Sistema: `/sem-acesso`, `/_not-found`.

---

## 2. O que já está implementado (vs. requisitos)

### Funcionalidades ✅
| Requisito | Status | Observação |
|---|---|---|
| Cadastro de participante (3 etapas) | ✅ | CPF opcional, ViaCEP, consentimento LGPD |
| Login/logout | ✅ | Supabase Auth |
| Recuperação de senha | ✅ | |
| Painel do indicador (KPIs) | ✅ | Dados reais |
| Nova indicação | ✅ | CPF opcional |
| Acompanhamento de status | ✅ | Tracking com 6 etapas |
| Chave PIX (salvar/remover/revelar) | ✅ | Criptografada via Vault |
| Recompensas (geração, liberação, pagamento) | ✅ | Automática ao marcar instalado |
| Dashboard admin (KPIs, gráficos, ranking) | ✅ | Recharts |
| Gestão de indicações (filtros, status, histórico) | ✅ | |
| Gestão de indicadores (lista, PIX reveal) | ✅ | |
| Configuração de campanha (valor, prazo) | ✅ | |
| Exportação Excel | ✅ | Botão em /admin/recompensas |
| Relatório de acessos | ✅ | Tabela page_views + RPC |
| RBAC (indicador/comercial/admin) | ✅ | Middleware + Server Actions + RLS |
| CAPTCHA (Turnstile) | ✅ | Login + cadastro |
| MFA (TOTP) — código preparado | ✅ | Página /configurar-mfa, serviços |
| Auditoria (audit_logs) | ✅ | |
| LGPD (consents, termos, privacidade) | ✅ | |
| PWA (manifest, service worker, offline) | ✅ | |
| Hospedagem gratuita (Cloudflare Workers) | ✅ | CI/CD via GitHub Actions |
| Identidade visual (verde #D2DD3A, grafite #31393F) | ✅ | |
| Logo real (extraído do PDF) | ✅ | |
| Apresentação de vendas (HTML) | ✅ | 10 slides |

### Funcionalidades ❌ (ausentes ou parciais)
| Requisito | Status | Prioridade |
|---|---|---|
| Fluxo de 5 etapas visual (timeline interativa) | ❌ | Alta |
| Status granulares (17 status) | ⚠️ Parcial (6 status) | Alta |
| 4 níveis de acesso (falta "operacional") | ⚠️ 3 níveis | Média |
| Gestão de usuários (criar/bloquear/editar) | ❌ | Alta |
| Configuração de campanhas (início/encerramento) | ❌ | Média |
| Relatórios por período/filtros avançados | ⚠️ Parcial | Média |
| Notificações (estrutura + central) | ❌ | Baixa |
| Exportação CSV | ❌ (só Excel) | Baixa |
| Paginação server-side | ❌ (limit 500) | Média |
| MFA no login (desafio TOTP) | ⚠️ Código preparado | Média |
| Rate limiting | ❌ | Alta |
| Ambiente de homologação | ❌ | Baixa |
| Testes automatizados | ❌ | Média |

---

## 3. Lacunas técnicas

### 3.1 Status do fluxo
Atual: 6 status (recebida, em análise, não atendemos região, atendemos região, aguardando contato, instalado, cancelado, reprovado).
Requerido: 17 status granulares (nova indicação, aguardando contato, em contato, análise técnica, viabilidade aprovada, sem viabilidade, aguardando contratação, contrato aprovado, instalação agendada, instalada, primeira mensalidade pendente, primeira mensalidade confirmada, bonificação aprovada, bonificação disponível, bonificação paga, cancelada, reprovada).

**Impacto:** Migration + código. Precisa atualizar enum, status.ts, status-badge, admin forms, tracking preview.

### 3.2 Níveis de acesso
Atual: `indicador`, `comercial`, `admin`.
Requerido: `participante`, `operacional`, `gestor`, `administrador_supremo`.

**Impacto:** Migration (alterar enum), proxy.ts, todas as páginas, RBAC. Alto risco de quebra.

### 3.3 Gestão de usuários
Ausente: criar/editar/bloquear gestores, definir permissões, histórico de atividades.

### 3.4 Configuração de campanhas
Ausente: datas de início/encerramento, condições de liberação, prazos.

### 3.5 Notificações
Ausente: tabela, triggers, central de notificações, integração e-mail/WhatsApp.

---

## 4. Riscos identificados

| Risco | Nível | Mitigação |
|---|---|---|
| Cadastros automatizados (bots) | Alto | Turnstile implementado, mas sem rate limiting |
| Força bruta no login | Alto | Supabase Auth tem proteção básica |
| Elevação de privilégio | Médio | RBAC no backend, revisar policies |
| Performance com >500 registros | Médio | Paginação server-side |
| Ausência de testes | Médio | Criar testes de integração |
| Indicações duplicadas (CPF) | Baixo | Constraint unique no referral_sensitive |
| Pagamentos duplicados | Baixo | Índice único de recompensa ativa |

---

## 5. Plano de execução (priorizado)

### Fase 1 — Correções críticas (segurança + fluxo)
1. **Status granulares:** atualizar enum + migration + código (status.ts, badge, admin forms, tracking).
2. **Regra de bonificação:** validar no backend (RPC) que bonificação só é liberada após confirmação da primeira mensalidade.
3. **Rate limiting:** Cloudflare WAF (gratuito, sem código).
4. **MFA no login:** desafio TOTP (código já preparado).

### Fase 2 — Funcionalidades comerciais
1. **Gestão de usuários:** CRUD de gestores, bloqueio/reativação, permissões.
2. **Configuração de campanhas:** datas, condições, prazos.
3. **Paginação server-side:** listas de indicações, indicadores, recompensas.
4. **Exportação CSV:** além do Excel.
5. **Filtros por período:** dashboard e relatórios.

### Fase 3 — UX e interatividade
1. **Timeline interativa** do fluxo "Como funciona" (5 etapas) no painel e na landing.
2. **Dashboard clicável:** KPIs direcionam para listagens.
3. **Notificações:** tabela + triggers + central de notificações.
4. **Otimização mobile:** touch targets, spacing, tipografia.

### Fase 4 — Qualidade e produção
1. **Testes:** unitários (validações) + integração (fluxos críticos).
2. **Ambiente de homologação:** branch `staging` + worker separado.
3. **Monitoramento:** Cloudflare Logs + Sentry (opcional).
4. **Documentação:** atualizar com novas features.

---

## 6. Decisões necessárias do usuário

1. **Status granulares:** Posso expandir de 6 para 17 status. Isso requer migration + código. Autoriza?
2. **4 níveis de acesso:** Posso adicionar `operacional` e `administrador_supremo` (hoje temos `indicador`, `comercial`, `admin`). Autoriza?
3. **Gestão de usuários:** Posso implementar CRUD de gestores. Autoriza?
4. **Configuração de campanhas:** Posso adicionar datas/prazos/condições. Autoriza?
5. **Notificações por e-mail:** Qual serviço? (Resend, SendGrid, Supabase Auth). Preciso de API key.
6. **Ambiente de homologação:** Criar branch `staging` + worker separado no Cloudflare?

---

## 7. Próximo passo

Aguardando autorização para iniciar a **Fase 1 (Correções críticas)**. Posso começar pelos status granulares e a regra de bonificação (validação no backend).

**Nenhuma alteração foi feita.** O projeto está intacto e funcional em https://estar-on-indica.julianoridsi.workers.dev.