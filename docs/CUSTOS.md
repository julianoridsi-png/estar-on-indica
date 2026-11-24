# Custos externos — Estar On Indica

## Decisão atual: operar no plano gratuito

O aplicativo **não depende** de Make, n8n, CRM, Google Sheets ou provedor de IA para funcionar. Essas integrações são opcionais e só passam a existir quando forem realmente implementadas e contratadas.

Podem ser canceladas **sem impacto** no login, cadastro, indicações, permissões, banners, benefícios, notificações ou no Smart Follow-Up:

| Serviço | Situação no app | Ação recomendada |
|---|---|---|
| Make (Integromat) | Nenhum código usa Make. É apenas uma opção no Connect Hub. | Cancelar assinatura/trial e, se quiser, excluir a conta. |
| n8n Cloud | Nenhum código usa n8n. | Cancelar o trial/plano cloud. Self-hosted continua gratuito. |
| CRM | Nenhum CRM está conectado. | Não contratar até existir operação comercial que justifique. |
| Google Sheets | Nenhuma planilha conectada. | Não contratar; a API tem cota gratuita. |
| OpenAI / Anthropic / Gemini | ON AI não foi implementado. | Não contratar chaves até o módulo ser desenvolvido. |
| WhatsApp Business Platform | Só há link manual de WhatsApp, sem API paga. | Sem custo enquanto não houver envio por template. |

## Serviços que devem ser mantidos

| Serviço | Plano | Custo | Observação |
|---|---|---|---|
| Supabase | Free | $0 | Banco, autenticação e storage. Projetos free podem ser pausados por inatividade. |
| Cloudflare Workers | Free | $0 | Hospedagem do site e do Worker. |
| GitHub | Free | $0 | Repositório e deploy automático. |
| Cloudflare Turnstile | Free | $0 | Proteção contra bots no login/cadastro. |
| Resend (opcional) | Free | $0 | 3.000 e-mails/mês. Só necessário se quiser SMTP próprio. |
| Domínio (se houver) | Anual | variável | Único custo recorrente realmente necessário para marca própria. |

**Custo mensal da infraestrutura base: $0** (fora domínio), dentro dos limites dos planos gratuitos.

## Limites dos planos gratuitos (referência)

| Serviço | Limite gratuito | Quando considerar upgrade |
|---|---|---|
| Supabase Free | ~500 MB de banco, 50 mil usuários ativos/mês, pausa por inatividade | Backups automáticos, mais conexões ou banco maior |
| Cloudflare Workers Free | 100 mil requisições/dia | Tráfego acima do limite ou CPU time maior |
| GitHub Actions Free | 2.000 minutos/mês (repositório privado) | Muitos deploys por dia |
| Resend Free | 100 e-mails/dia (3.000/mês) | Volume maior de e-mails transacionais |

## Checklist de cancelamento do Make

1. Acesse https://www.make.com/en/login (ou `eu1.make.com`, se a conta for europeia).
2. Clique no avatar → **Billing** (ou **Organization → Billing**).
3. Se estiver em trial: **Cancel plan** / **Downgrade to Free**.
4. Se houver plano pago: **Cancel subscription**. O acesso continua até o fim do período já pago.
5. Para excluir a conta: **Profile → Delete account** (cancele o plano antes).
6. O login via GitHub é apenas autenticação (SSO). Para remover a autorização:
   GitHub → **Settings → Applications → Authorized OAuth Apps → Make → Revoke**.

> Excluir a conta do Make **não afeta** o GitHub nem o Estar On Indica.

## Checklist do n8n Cloud (se houver trial)

1. Acesse https://app.n8n.cloud.
2. **Settings → Billing → Cancel plan**.
3. Exclua o workspace se não for usar.
4. Alternativa gratuita: n8n self-hosted (não recomendado para produção sem servidor dedicado).

## Observações

- A migration 0020 apenas **prepara** multi-tenancy; não há custo adicional.
- O Smart Follow-Up usa **pg_cron do próprio Supabase**, sem serviço externo pago.
- A Central de Saúde (`/admin/saude`) mostra o status real do cron e das tabelas.
- Valores e limites podem mudar pelos provedores; confirme no painel de cada serviço antes de contratar.
