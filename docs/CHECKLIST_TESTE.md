# Checklist de teste — Etapa 1

Use este roteiro para validar a entrega. Marque cada item e anote qualquer diferença.

## A. Antes de configurar o Supabase

Esses testes confirmam que o site não quebra sem credenciais.

- [ ] `npm run dev` inicia sem erro.
- [ ] `http://localhost:3000` abre a landing page.
- [ ] O menu público navega para **Regras**, **Termos** e **Privacidade**.
- [ ] `http://localhost:3000/login` mostra o aviso de configuração necessária.
- [ ] `http://localhost:3000/cadastro` mostra o aviso de configuração necessária.
- [ ] `http://localhost:3000/painel` redireciona para o login (ou mostra a tela de configuração).
- [ ] `http://localhost:3000/rota-inexistente` mostra a página 404 personalizada.
- [ ] O layout se adapta a celular e desktop.

## B. Depois de configurar o Supabase

Siga primeiro `docs/SETUP_SUPABASE.md`.

- [ ] As cinco migrations foram executadas sem erro.
- [ ] O `.env.local` tem URL e anon key corretas.
- [ ] O servidor foi reiniciado após preencher o `.env.local`.
- [ ] O aviso de configuração desapareceu das telas de login e cadastro.

## C. Cadastro e confirmação

- [ ] O cadastro tem três etapas: dados, endereço e acesso.
- [ ] CPF inválido é bloqueado com mensagem clara.
- [ ] CEP válido preenche endereço, bairro, cidade e UF.
- [ ] O aceite dos termos é obrigatório.
- [ ] A senha exige letra maiúscula, minúscula, número e 8 caracteres.
- [ ] O cadastro conclui e mostra a tela de confirmação de e-mail, quando a confirmação está ativa.
- [ ] O e-mail de confirmação chega e o link abre a área correta.
- [ ] Tentar cadastrar o mesmo CPF novamente é bloqueado.
- [ ] Tentar cadastrar o mesmo e-mail novamente é bloqueado.

## D. Login e perfil do indicador

- [ ] Login com credenciais corretas entra no sistema.
- [ ] Login com senha errada mostra mensagem genérica e segura.
- [ ] O indicador é direcionado para `/painel`.
- [ ] O nome exibido é o primeiro nome do cadastro.
- [ ] Os seis cards mostram **0** para uma conta nova (sem dados fictícios).
- [ ] A seção “Indicações recentes” mostra o estado vazio correto.
- [ ] O botão “Compartilhar programa” abre o WhatsApp com o texto de convite.
- [ ] O CPF aparece mascarado no formato `***.***.***-12`.
- [ ] A opção “Sair da conta” encerra a sessão.

## E. Proteção por perfil

- [ ] Com perfil **indicador**, acessar `/admin` redireciona para `/painel`.
- [ ] Sem sessão, acessar `/painel` ou `/admin` redireciona para `/login` com `next` correto.
- [ ] O login de administrador redireciona para `/admin`.
- [ ] O login de comercial redireciona para `/admin`.
- [ ] O administrador não vê o painel de indicador em `/painel` (é redirecionado para `/admin`).

## F. Painel administrativo

- [ ] A conta promovida a admin entra em `/admin`.
- [ ] Os cards usam dados reais do banco.
- [ ] A distribuição por status mostra todos os status com 0 para uma base vazia.
- [ ] O comercial **não** vê os cards de recompensas.
- [ ] O administrador vê os cards de recompensas.
- [ ] A lista de indicações recentes mostra “Somente leitura” e o estado vazio correto.
- [ ] O indicador não consegue abrir `/admin`.

## G. Banco de dados e segurança

No SQL Editor do Supabase:

- [ ] `select * from public.profiles` mostra o perfil criado.
- [ ] `select * from public.profile_sensitive` mostra apenas valores binários para CPF (nunca texto legível).
- [ ] O campo `cpf_final` tem somente 2 dígitos.
- [ ] Existe um registro `SIGNUP` em `public.audit_logs`.
- [ ] Existem registros em `public.consents` para termos e privacidade.
- [ ] `select tablename, rowsecurity from pg_tables where schemaname='public'` mostra RLS ativo nas tabelas.
- [ ] O bucket `branding` existe em **Storage**.
- [ ] A chave `estar_on_cpf_key` existe em `vault.secrets` (sem exibir o segredo).

## H. PWA e responsividade

- [ ] O manifest é servido em `/manifest.webmanifest`.
- [ ] Os ícones placeholder carregam.
- [ ] A página `/offline` abre.
- [ ] O site é instalável como PWA no navegador compatível.
- [ ] A navegação funciona em tela pequena, tablet e desktop.

## I. Build de produção

```bash
npm run typecheck
npm run lint
npm run build
```

- [ ] Os três comandos terminam sem erro.
- [ ] O build lista as rotas `/`, `/login`, `/cadastro`, `/painel`, `/admin`, `/sem-acesso` e as páginas legais.

## J. Etapa 2 — PIX e indicações do indicador

- [ ] `/indicacoes` lista as indicações do usuário com filtros por status e grupo.
- [ ] `/indicacoes/nova` cadastra uma indicação com ViaCEP e consentimento LGPD.
- [ ] A indicação aparece no painel do indicador e no painel administrativo.
- [ ] `/recebimentos` permite cadastrar, atualizar e remover a chave PIX.
- [ ] A chave PIX é exibida mascarada e a completa fica criptografada no banco.
- [ ] O painel do indicador exibe chamada para cadastrar PIX quando ausente.

## K. Etapa 2 — Painel administrativo e recompensas

- [ ] `/admin` exibe KPIs, gráfico mensal, distribuição por status e top indicadores.
- [ ] `/admin/indicacoes` filtra por status, grupo e indicador.
- [ ] `/admin/indicacoes/[id]` permite atualizar o status com observação.
- [ ] Marcar uma indicação como instalada cria uma recompensa pendente quando o valor da campanha está configurado.
- [ ] `/admin/indicadores` lista indicadores com status da chave PIX.
- [ ] O administrador consegue revelar a chave PIX completa com registro de auditoria.
- [ ] `/admin/recompensas` permite liberar, pagar e cancelar recompensas.
- [ ] O pagamento só é registrado quando o indicador possui chave PIX.
- [ ] `/admin/recompensas` atualiza o valor e o prazo da campanha.
- [ ] O comercial não acessa `/admin/recompensas` nem revela chaves PIX.

## L. Etapa 2 — Banco de dados

- [ ] As migrations `0006` e `0007` foram executadas em ordem.
- [ ] A tabela `payout_accounts` existe e possui RLS ativo.
- [ ] As funções `get_indicator_stats` e `get_admin_stats` retornam `por_mes` e `top_indicadores`.
- [ ] O segredo `estar_on_cpf_key` segue válido (reutilizado para PIX).

## M. Build de produção (Etapa 2)

```bash
npm run typecheck
npm run lint
npm run build
```

- [ ] Os três comandos terminam sem erro.
- [ ] O build lista as rotas `/indicacoes`, `/indicacoes/nova`, `/recebimentos`, `/admin/indicacoes`, `/admin/indicadores` e `/admin/recompensas`.

Se algo falhar, envie:

1. A página e o passo do checklist.
2. A mensagem exibida na tela.
3. O horário aproximado do erro.
4. Se possível, o log do terminal e o log do Supabase (**Logs > Postgres** ou **Logs > Auth**).

Não envie senhas, chave `service_role`, CPF completo ou o conteúdo de `vault.decrypted_secrets`.
