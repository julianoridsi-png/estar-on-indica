# Manual do administrador — Estar On Indica

## Acesso
- Acesse `/login` com credenciais de administrador.
- O painel administrativo está em `/admin`.

## Funcionalidades

### Central de controle (`/admin`)
- Indicadores do programa (indicadores, indicações, contratos, instalações, recompensas).
- Gráficos de evolução mensal e distribuição por status.
- Top indicadores e indicações recentes.
- Relatório de acessos.
- Atalhos de gestão.

### Gestão de indicações (`/admin/indicacoes`)
- Lista todas as indicações com filtros.
- Detalhe de cada indicação com histórico.
- Alteração de status (com observações).

### Indicadores (`/admin/indicadores`)
- Lista de indicadores com busca.
- Filtro por chave PIX pendente.
- Desempenho (indicações, instalações).

### Usuários (`/admin/usuarios`)
- Busca por nome, e-mail, cidade.
- Alteração de perfil (indicador/comercial/admin) e status (ativo/inativo).
- Operação via RPC security-definer (auditoria automática).

### Recompensas (`/admin/recompensas`)
- Gestão de recompensas (status, valores, PIX).
- Configuração de campanha (reward-settings).

### Integrações (`/admin/integracoes`)
- Connect Hub: 7 conectores.
- Configuração, teste, desconexão.
- Histórico de eventos.

### Automações (`/admin/automacoes`)
- Automation Studio: construtor visual de fluxos.
- Blocos conectados, simulação, histórico de execuções.

### Analytics (`/admin/analytics`)
- Growth Engine: KPIs, insights, recomendações.
- Analytics Studio: construtor de relatórios, exportação CSV/PDF.

### Inteligência de clientes (`/admin/clientes`)
- Segmentação (novos, ativos, inativos, alto desempenho, pendentes).
- Filtros e busca.
- Detalhes de atividade.

### Segurança (`/admin/seguranca`)
- Postura de segurança, auditoria, cabeçalhos HTTP.

### Configuração MFA (`/configurar-mfa`)
- Enrolamento de autenticação multifator.

## Regras
- Alterações de permissão/status são auditadas.
- Recompensas não são pagas automaticamente — dependem de validação.
- Dados sensíveis (CPF, PIX) são mascarados; revelação auditada.
