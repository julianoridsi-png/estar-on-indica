# Integrações — Connect Hub

## Conectores disponíveis

1. WhatsApp Business Platform — notificações, status, recompensas.
2. E-mail (SMTP) — confirmações, recuperação, notificações.
3. n8n — automações externas, gatilhos, fluxos.
4. Make (Integromat) — automações de marketing, sincronização.
5. CRM (API genérica) — sincronização de clientes, oportunidades.
6. Google Sheets — exportação, relatórios, sincronização.
7. Webhook personalizado — conexões customizadas.

## Status de uma integração
- **Não configurada**: sem credenciais.
- **Configurada**: credenciais salvas.
- **Conectada**: teste real bem-sucedido.
- **Erro**: teste falhou.
- **Desconectada**: desconectada pelo admin.

Uma integração só é marcada como **Conectada** após um teste real bem-sucedido no provedor externo.

## Requisitos por provedor
- WhatsApp Business: conta Meta Business, phone_number_id, access_token, verify_token.
- E-mail: servidor SMTP, porta, usuário, senha, remetente.
- n8n: webhook URL, API key (opcional).
- Make: webhook URL.
- CRM: URL da API, API key/token.
- Google Sheets: ID da planilha, Service Account JSON.
- Webhook: URL, secret (HMAC).

## Webhooks recebidos
Endpoint: `POST /api/v1/webhooks/receive`
- Validação HMAC-SHA256 via header `X-Webhook-Signature` (se `WEBHOOK_SECRET` configurado).
- Retorna 202 (Accepted) — processamento assíncrono pendente de fila.

## Histórico
Cada integração possui histórico de eventos (configuração, teste, desconexão, falhas) na tabela `integration_events`.
