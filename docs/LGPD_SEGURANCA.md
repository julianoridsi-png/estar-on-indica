# Segurança e LGPD

> Este documento descreve a implementação técnica e serve como base para revisão jurídica. Ele não substitui a avaliação de um advogado ou encarregado de dados (DPO).

## Princípios adotados

- **Minimização:** cada tela coleta e exibe apenas o necessário.
- **Finalidade:** os dados são usados para operar o programa de indicação e cumprir obrigações contratuais/legais.
- **Segurança:** CPF cifrado, RLS, menor privilégio e auditoria.
- **Transparência:** termos, política de privacidade e registro de consentimento.
- **Prestação de contas:** trilha de auditoria para operações relevantes.

## Dados tratados

| Dado | Onde fica | Finalidade | Acesso |
| --- | --- | --- | --- |
| Nome, e-mail, endereço, cidade/UF | `profiles` | Cadastro, contato e operação | Dono, comercial e admin |
| CPF completo | `profile_sensitive.cpf_encrypted` | Identificação e prevenção de fraude/duplicidade | Somente funções internas; não exposto pela API |
| Hash do CPF | `profile_sensitive.cpf_hash` | Impedir cadastro duplicado | Não exposto pela API |
| Telefone | `profile_sensitive.telefone` | Contato operacional | Dono, comercial e admin |
| Dados do indicado | `referrals` | Análise e contratação | Indicador dono, comercial e admin |
| CPF do indicado | `referral_sensitive.cpf_encrypted` | Identificação e prevenção de duplicidade | Somente funções internas auditadas |
| Histórico de status | `referral_history` | Transparência e acompanhamento | Indicador dono, comercial e admin |
| Recompensas | `rewards` | Gestão do benefício | Indicador dono e admin |
| Consentimentos | `consents` | Comprovação de aceite | Dono e admin |
| Auditoria | `audit_logs` | Segurança e prestação de contas | Admin |
| Configurações da marca | `settings` | Identidade visual | Público (sem segredos) |

## CPF: como é protegido

### Criptografia

- O CPF completo é cifrado com **AES-256** usando `pgp_sym_encrypt`.
- A chave é gerada aleatoriamente (32 bytes) e armazenada no **Supabase Vault** com o nome `estar_on_cpf_key`.
- A chave não fica no repositório, no `.env.local` nem no código.
- Se a chave não existir, as funções lançam exceção e o cadastro é abortado. O sistema **falha fechado**.

### Unicidade sem exposição

- Um **HMAC-SHA256** do CPF normalizado é gravado em `cpf_hash`.
- O hash tem índice único, impedindo dois cadastros com o mesmo CPF.
- O hash não é retornado para o navegador.

### Exibição

- As telas mostram apenas os dois últimos dígitos: `***.***.***-12`.
- O CPF completo nunca é enviado ao cliente nas telas atuais.

### Revelação administrativa

A função `private.cpf_decifrar` existe para futuras rotinas internas. Ela **não** tem permissão de execução para `anon` ou `authenticated`.

Quando a revelação do CPF completo for necessária para a operação:

1. Criar uma RPC `security definer` específica.
2. Exigir papel `admin`.
3. Exigir justificativa e confirmação.
4. Registrar ator, data, hora, finalidade e registro consultado em `audit_logs`.
5. Nunca retornar o CPF em listagens.
6. Avaliar prazo de retenção do próprio log de acesso.

## Row Level Security

| Tabela | Indicador | Comercial | Admin | Anônimo |
| --- | --- | --- | --- | --- |
| `profiles` | Próprio | Todos | Todos | Nenhum |
| `profile_sensitive` | Próprio (somente telefone) | Telefone | Telefone | Nenhum |
| `referrals` | Próprias | Todas | Todas | Nenhum |
| `referral_sensitive` | Nenhum | Nenhum | Nenhum (via função auditada) | Nenhum |
| `referral_history` | Próprias | Todas | Todas | Nenhum |
| `rewards` | Próprias | Nenhum | Todas | Nenhum |
| `campaigns` | Ativas | Ativas | Todas | Ativas |
| `settings` | Leitura | Leitura | Leitura/escrita | Leitura |
| `consents` | Próprios | Nenhum | Todos | Nenhum |
| `audit_logs` | Nenhum | Nenhum | Leitura | Nenhum |
| `notifications` | Próprias | Próprias | Próprias | Nenhum |

As policies ficam em `supabase/migrations/0004_rls_grants.sql`.

## Papéis

- **Indicador:** acessa apenas o próprio painel, perfil, indicações e recompensas.
- **Comercial:** atua na operação das indicações. Não acessa recompensas nem auditoria.
- **Admin:** gerencia a operação, recompensas, configurações, branding e auditoria.

A promoção de papel é feita por SQL no painel do Supabase. O formulário de cadastro não pode escolher o papel.

## Auditoria

São registrados automaticamente:

- cadastro (`SIGNUP`);
- alterações e exclusões de perfil;
- criação, alteração e exclusão de indicações;
- criação, alteração e exclusão de recompensas;
- criação, alteração e exclusão de campanhas;
- alterações de configurações.

Cada evento guarda ator, e-mail do ator, ação, tabela, ID do registro, dados anteriores/novos (quando aplicável) e data/hora. Campos de CPF cifrado e hash não entram na auditoria.

A auditoria não é editável pela API. Somente administradores podem ler.

## Consentimentos

- O cadastro registra a versão dos termos e da política de privacidade aceitos.
- As versões ficam em `src/lib/legal.ts` e em `settings`.
- Ao publicar uma nova versão, o fluxo de reaceite deverá ser implementado antes de exigir o consentimento atualizado.
- Consentimento não é a única base legal possível; a operação pode se apoiar em execução de contrato e obrigações legais. A definição deve ser validada juridicamente.

## Direitos dos titulares

A LGPD garante, entre outros:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários;
- portabilidade;
- eliminação dos dados tratados com consentimento;
- informação sobre compartilhamento;
- revogação do consentimento.

**Status atual:** a Etapa 1 registra consentimentos e permite correção de alguns dados cadastrais, mas ainda não oferece uma central de privacidade com exportação, exclusão e revogação automatizadas. Esses fluxos devem ser implementados antes de uma operação em larga escala.

Enquanto isso, solicitações devem ser atendidas por procedimento interno documentado, com verificação de identidade e registro em auditoria.

## Retenção e descarte

Sugestão inicial (a validar com jurídico e contabilidade):

- Dados de cadastro e indicações: enquanto durar a relação e pelos prazos legais aplicáveis.
- Recompensas e registros financeiros: pelo prazo fiscal/contábil exigido.
- Logs de auditoria: prazo definido em política interna, com acesso restrito.
- Consentimentos: enquanto o tratamento existir e pelo prazo de comprovação.
- Dados de indicados não convertidos: avaliar anonimização após prazo definido.

Exclusões devem priorizar anonimização quando houver obrigação legal de retenção. Não apague registros manualmente sem avaliar o impacto em auditoria, recompensas e obrigações fiscais.

## Segurança da aplicação

- Autenticação validada no servidor com `auth.getUser()`.
- Cookies gerenciados por `@supabase/ssr`.
- Rotas protegidas no proxy e nas páginas.
- Nenhuma chave `service_role` no cliente.
- Cabeçalhos:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restritiva
  - HSTS em produção
- Upload de logo restrito a admin, com limite de 2 MB e tipos PNG/JPEG/WebP.
- SVG não é aceito no bucket para evitar scripts embutidos.

## Riscos e pendências

1. **Enumeração de CPF:** `cpf_disponivel` revela se um CPF está cadastrado. Mitigar com rate limiting, CAPTCHA e monitoramento.
2. **Rate limiting:** ainda não implementado no aplicativo. Configurar na Vercel/WAF ou em camada de borda.
3. **SMTP:** o serviço padrão do Supabase não é adequado para produção.
4. **Central de privacidade:** exportação, exclusão e revogação ainda pendentes.
5. **Revelação de CPF:** fluxo auditado ainda pendente.
6. **Backups:** configurar retenção e teste de restauração no Supabase.
7. **Monitoramento:** alertas para picos de cadastro, erros de autenticação e falhas de criptografia.
8. **Revisão jurídica:** termos, política e bases legais precisam de validação.

## Resposta a incidentes

1. Conter o acesso indevido (revogar chaves, sessões e credenciais).
2. Preservar evidências em `audit_logs` e logs do Supabase.
3. Avaliar dados afetados e titulares.
4. Acionar o encarregado de dados e a assessoria jurídica.
5. Cumprir prazos de comunicação à ANPD e aos titulares, quando aplicável.
6. Corrigir a causa e registrar o aprendizado.

## Contato e encarregado

Antes da produção, defina:

- nome do encarregado de dados (DPO);
- canal de atendimento ao titular;
- endereço e prazo de resposta;
- política de cookies e tecnologias similares;
- procedimento de verificação de identidade para solicitações.
