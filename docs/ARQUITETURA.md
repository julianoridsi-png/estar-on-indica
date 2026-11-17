# Arquitetura

## Visão geral

O **Estar On Indica** é uma aplicação Next.js com renderização no servidor, autenticação Supabase e banco PostgreSQL protegido por Row Level Security (RLS).

```
Navegador
   │
   ├── Site público (SSR/estático)
   ├── Formulários de autenticação (client components + server actions)
   └── Área autenticada (server components)
          │
          ▼
     Supabase Auth ── cookies httpOnly ── proxy.ts
          │
          ▼
     PostgreSQL + RLS
          ├── profiles / profile_sensitive
          ├── referrals / referral_sensitive / referral_history
          ├── rewards / campaigns
          ├── settings / consents / notifications
          └── audit_logs
```

Não há `service_role` no frontend. As consultas usam a sessão do usuário e as policies definem o que ele pode ler ou alterar. As únicas operações privilegiadas são funções `security definer` com verificação explícita de papel, como `get_admin_stats`.

## Stack e decisões

| Área | Escolha |
| --- | --- |
| Framework | Next.js 16.4 com App Router e React 19 |
| Linguagem | TypeScript estrito |
| Estilo | Tailwind CSS 4, tokens próprios e shadcn/ui |
| Ícones | Lucide |
| Formulários | React Hook Form + Zod |
| Autenticação | Supabase Auth com `@supabase/ssr` |
| Banco | PostgreSQL do Supabase com RLS |
| Storage | Bucket público `branding` para logotipo |
| PWA | Manifest, service worker e página offline |
| Deploy | Vercel |

### Next.js 16

- O antigo `middleware.ts` foi substituído por `src/proxy.ts`.
- `cookies()` é assíncrono nos clientes Supabase.
- As páginas tipam parâmetros com `PageProps<"/rota">`, gerado por `next typegen`.
- O script `npm run typecheck` executa `next typegen` antes do `tsc`.

## Rotas

### Públicas

| Rota | Função |
| --- | --- |
| `/` | Landing page e apresentação do programa |
| `/regras` | Regras da campanha |
| `/termos` | Termos de uso |
| `/privacidade` | Política de privacidade e LGPD |
| `/login` | Entrada |
| `/cadastro` | Cadastro em três etapas |
| `/cadastro/confirmar` | Orientação e reenvio de confirmação |
| `/recuperar-senha` | Solicitação de recuperação |
| `/redefinir-senha` | Definição de nova senha (com sessão de recuperação) |
| `/auth/callback` | Troca de código PKCE por sessão |
| `/auth/confirm` | Verificação de `token_hash` para templates personalizados |
| `/offline` | Fallback do service worker |
| `/manifest.webmanifest` | Manifesto PWA |

### Protegidas

| Rota | Perfis | Função |
| --- | --- | --- |
| `/painel` | indicador | Painel pessoal (somente leitura na Etapa 1) |
| `/admin` | admin, comercial | Visão geral da operação |
| `/comercial` | admin, comercial | Redireciona para `/admin` |
| `/sem-acesso` | autenticado | Fallback para perfil ausente ou acesso não liberado |

## Perfis e permissões

| Papel | Acesso |
| --- | --- |
| `indicador` | Próprio perfil, próprias indicações, próprias recompensas |
| `comercial` | Perfis, indicações, histórico, atualização operacional de status |
| `admin` | Tudo do comercial + recompensas, auditoria, configurações e branding |

Regras importantes:

- O papel é gravado em `profiles.tipo_usuario`.
- O cadastro sempre cria `indicador`, independentemente de metadata enviada pelo cliente.
- A promoção para `comercial` ou `admin` é feita por SQL no painel do Supabase (ou por rotina administrativa futura).
- O comercial não vê registros de recompensa. As policies de `rewards` liberam leitura apenas para o dono e para admin.
- A função `get_admin_stats` retorna contagens de recompensa zeradas para o comercial, mesmo que ela seja chamada diretamente.

## Fluxo de autenticação

### Cadastro

1. O formulário valida os dados no navegador com Zod.
2. A server action `signUpAction` valida novamente no servidor.
3. A RPC `cpf_disponivel` normaliza o CPF, valida os dígitos e compara o HMAC com `profile_sensitive.cpf_hash`.
4. `supabase.auth.signUp` cria o usuário com metadata de cadastro.
5. O trigger `on_auth_user_created` executa `private.handle_new_user()`:
   - cria o perfil com papel `indicador`;
   - criptografa o CPF e grava o hash;
   - registra os consentimentos;
   - grava um evento `SIGNUP` na auditoria.
6. Se a confirmação de e-mail estiver ativa, o usuário vai para `/cadastro/confirmar`; caso contrário, entra direto em `/painel`.

Se a chave do Vault estiver ausente, a criptografia falha de forma fechada e o cadastro é abortado. Nenhum CPF é gravado em texto puro.

### Sessão

- O cliente server-side usa cookies do `@supabase/ssr`.
- `getCurrentSession` é memoizado por requisição com `React.cache`; layout e página compartilham a mesma consulta.
- O proxy valida o usuário com `auth.getUser()` (não confia em `getSession()` para autorização).
- O proxy também consulta o perfil para decidir o redirecionamento por papel.

### Recuperação de senha

1. O usuário informa o e-mail.
2. A resposta é genérica, para não revelar se a conta existe.
3. O link aponta para `/auth/callback?next=/redefinir-senha`.
4. A página só exibe o formulário se houver sessão de recuperação válida.
5. Após alterar a senha, as outras sessões são encerradas.

## Modelo de dados

```
auth.users
  └── profiles (1:1)
        ├── profile_sensitive (CPF cifrado + hash + telefone)
        ├── consents (termos/privacidade)
        ├── notifications
        ├── referrals (como indicador)
        │     ├── referral_sensitive (CPF cifrado + hash)
        │     ├── referral_history (mudanças de status)
        │     └── rewards
        └── audit_logs (ator)

settings (singleton)
campaigns
```

### Tabelas principais

- **profiles**: nome, e-mail, CPF final, endereço, papel, status, timestamps.
- **profile_sensitive**: CPF cifrado, HMAC e telefone; sem acesso direto pela API.
- **referrals**: dados não sensíveis da pessoa indicada, status e vínculo com o indicador.
- **referral_sensitive**: CPF cifrado e HMAC do indicado.
- **referral_history**: trilha de cada mudança de status, com autor e observação.
- **rewards**: recompensas por indicação, com tipo, valor, status e datas.
- **campaigns**: campanhas e regulamentos.
- **settings**: identidade visual e parâmetros públicos (linha única `id = 1`).
- **consents**: versão dos termos e da política aceitos, com data.
- **audit_logs**: eventos de cadastro, alterações de perfil, indicações, recompensas, campanhas e configurações.
- **notifications**: avisos internos por usuário.

### Status da indicação

A jornada principal é:

```
Indicação recebida
  → Em análise
  → Atendemos a região
  → Aguardando contato / Em negociação
  → Contrato aprovado
  → Instalação agendada
  → Instalado
```

Status finais alternativos:

- **Não atendemos a região**
- **Cancelado**
- **Reprovado**

Os valores do enum `status_indicacao` devem permanecer iguais aos de `src/lib/referrals/status.ts`.

## RPCs

### `cpf_disponivel(p_cpf text) → boolean`

- Executável por `anon` e `authenticated`.
- Normaliza e valida o CPF.
- Compara o HMAC com os perfis existentes.
- Não retorna o CPF nem o hash.

**Trade-off:** a função permite descobrir se um CPF já está cadastrado. Para reduzir abuso, o formulário deve ter rate limiting e proteção anti-bot na camada de borda em produção.

### `get_indicator_stats() → jsonb`

- `security invoker`.
- Retorna os totais visíveis pelas policies do próprio indicador.
- Contrato:

```json
{
  "total_indicacoes": 0,
  "em_andamento": 0,
  "aprovadas": 0,
  "instaladas": 0,
  "recompensas_pendentes": 0,
  "recompensas_disponiveis": 0
}
```

### `get_admin_stats() → jsonb`

- `security definer` com verificação de papel.
- Retorna dados agregados de toda a operação.
- Para `comercial`, as contagens de recompensa são `0`.
- Contrato:

```json
{
  "total_indicadores": 0,
  "total_indicacoes": 0,
  "contratos_aprovados": 0,
  "instalados": 0,
  "recompensas_pendentes": 0,
  "recompensas_pagas": 0,
  "por_status": {
    "indicacao_recebida": 0,
    "em_analise": 0
  }
}
```

## Segurança

- RLS ativo em todas as tabelas de domínio.
- Nenhuma policy de `INSERT` direto para indicações, recompensas ou consentimentos: as rotinas privilegiadas farão isso nas próximas etapas.
- Colunas sensíveis sem `SELECT` para `anon`/`authenticated`.
- `referral_sensitive` não possui policy: nega tudo por padrão.
- Atualizações de status são registradas pelo trigger de histórico e pelo trigger de auditoria.
- Chaves e segredos ficam no Vault e nas variáveis de ambiente do servidor.
- Cabeçalhos de segurança configurados em `next.config.ts`.

Detalhes em [`LGPD_SEGURANCA.md`](LGPD_SEGURANCA.md).

## PWA

- `src/app/manifest.ts` descreve nome, cores, ícones e modo standalone.
- `public/sw.js` faz cache do shell e de uma página offline.
- `ServiceWorkerRegister` registra o service worker apenas em produção.
- A página `/offline` permite tentar novamente.

## Etapas seguintes

### Etapa 2 — Operação

- Cadastro de indicação pelo indicador, com CPF cifrado e prevenção de duplicidade.
- Listagem e detalhe de indicações para a equipe.
- Mudança de status com histórico e observação.
- Recompensas e campanhas.
- Upload do logotipo e configurações.

### Etapa 3 — Gestão e conformidade

- Gráficos e relatórios.
- Notificações.
- Exportação de dados e fluxos de exclusão/anonimização.
- Rate limiting e proteção antiabuso.
- Monitoramento, backup e plano de resposta a incidentes.
