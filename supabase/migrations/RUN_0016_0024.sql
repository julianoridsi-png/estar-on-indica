-- ============================================================================
-- ESTAR ON INDICA - execucao unica das migrations 0016 a 0024
-- Cole TODO este arquivo no SQL Editor do Supabase e clique em Run (uma vez).
-- Requer que as migrations 0001 a 0015 ja tenham sido executadas.
-- Inclui a correcao 0024 do Smart Follow-Up.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- INICIO: 0016_admin_alterar_permissao_status.sql
-- ----------------------------------------------------------------------------

-- 0016_admin_alterar_permissao_status.sql
-- RPCs auditadas para alterar papel (tipo_usuario) e status de usuários.
-- Corrige a falha de alteração de permissão no frontend (grant de coluna ausente).
-- Toda mutação passa por função security definer, validando admin no servidor.

create or replace function public.admin_alterar_permissao_usuario(
  p_user_id uuid,
  p_novo_papel text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_target_role text;
begin
  if v_actor is null then
    raise exception 'Não autenticado';
  end if;

  if not private.is_admin() then
    raise exception 'Acesso negado: apenas administradores podem alterar permissões';
  end if;

  if p_user_id is null then
    raise exception 'Usuário inválido';
  end if;

  if p_user_id = v_actor then
    raise exception 'Um administrador não pode alterar a própria permissão';
  end if;

  if p_novo_papel not in ('indicador', 'comercial', 'admin') then
    raise exception 'Papel inválido: %', p_novo_papel;
  end if;

  select tipo_usuario::text into v_target_role
  from public.profiles
  where id = p_user_id;

  if v_target_role is null then
    raise exception 'Usuário não encontrado';
  end if;

  -- impedir promoção para papel superior sem autorização explícita
  -- (admin já é o maior nível; comercial não pode virar admin por esta rota)
  select tipo_usuario::text into v_role
  from public.profiles
  where id = v_actor;

  if v_role = 'comercial' and p_novo_papel = 'admin' then
    raise exception 'Sem autorização para promover a administrador';
  end if;

  update public.profiles
  set tipo_usuario = p_novo_papel::public.tipo_usuario
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'novo_papel', p_novo_papel);
end;
$$;

create or replace function public.admin_alterar_status_usuario(
  p_user_id uuid,
  p_novo_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if v_actor is null then
    raise exception 'Não autenticado';
  end if;

  if not private.is_admin() then
    raise exception 'Acesso negado: apenas administradores podem alterar status';
  end if;

  if p_user_id is null then
    raise exception 'Usuário inválido';
  end if;

  if p_user_id = v_actor then
    raise exception 'Um administrador não pode alterar o próprio status';
  end if;

  if p_novo_status not in ('ativo', 'inativo') then
    raise exception 'Status inválido: %', p_novo_status;
  end if;

  select tipo_usuario::text into v_role
  from public.profiles
  where id = v_actor;

  -- comercial não pode inativar administradores
  if v_role = 'comercial' then
    if exists (
      select 1 from public.profiles
      where id = p_user_id and tipo_usuario = 'admin'
    ) then
      raise exception 'Sem autorização para alterar status de administrador';
    end if;
  end if;

  update public.profiles
  set status = p_novo_status::public.status_usuario
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'novo_status', p_novo_status);
end;
$$;

grant execute on function public.admin_alterar_permissao_usuario(uuid, text) to authenticated;
grant execute on function public.admin_alterar_status_usuario(uuid, text) to authenticated;

comment on function public.admin_alterar_permissao_usuario(uuid, text) is
  'Altera o papel (tipo_usuario) de um usuário. Apenas administradores/comercial autorizados. Auditado por trigger.';
comment on function public.admin_alterar_status_usuario(uuid, text) is
  'Altera o status (ativo/inativo) de um usuário. Apenas administradores/comercial autorizados. Auditado por trigger.';


-- FIM: 0016_admin_alterar_permissao_status.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0017_integracoes.sql
-- ----------------------------------------------------------------------------

-- 0017_integracoes.sql
-- Estrutura para a Central de Integrações (Connect Hub) — Estar On Indica 4.0.
-- Armazena configurações de conectores por organização (multi-tenant ready).
-- Nenhuma integração é marcada como ativa sem teste real bem-sucedido.

create table if not exists public.integracoes (
  id uuid primary key default gen_random_uuid(),
  organizacao_id uuid,
  provider text not null,
  status text not null default 'nao_configurada'
    check (status in ('nao_configurada', 'configurada', 'conectada', 'erro', 'desconectada')),
  config jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organizacao_id, provider)
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  integracao_id uuid references public.integracoes(id) on delete cascade,
  event_type text not null,
  status text not null check (status in ('sucesso', 'falha', 'pendente')),
  summary text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists integracoes_org_idx on public.integracoes (organizacao_id, provider);
create index if not exists integration_events_integracao_idx on public.integration_events (integracao_id, created_at desc);

alter table public.integracoes enable row level security;
alter table public.integration_events enable row level security;

-- Leitura: admin e comercial
drop policy if exists integracoes_select_staff on public.integracoes;
create policy integracoes_select_staff
  on public.integracoes
  for select
  to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists integration_events_select_staff on public.integration_events;
create policy integration_events_select_staff
  on public.integration_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.integracoes i
      where i.id = integration_events.integracao_id
      and (private.is_admin() or private.tipo_usuario_atual() = 'comercial')
    )
  );

-- Escrita: apenas admin, via RPCs security definer (não direto)
revoke insert, update, delete on table public.integracoes from authenticated, anon;
revoke insert, update, delete on table public.integration_events from authenticated, anon;

-- RPC: upsert de configuração (admin only)
create or replace function public.admin_salvar_integracao(
  p_provider text,
  p_config jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.integracoes%rowtype;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Acesso negado';
  end if;

  if p_provider is null or length(trim(p_provider)) = 0 then
    raise exception 'Provider inválido';
  end if;

  insert into public.integracoes (organizacao_id, provider, status, config)
  values (null, p_provider, 'configurada', coalesce(p_config, '{}'::jsonb))
  on conflict (organizacao_id, provider) do update
    set config = coalesce(p_config, '{}'::jsonb),
        status = 'configurada',
        updated_at = now()
  returning * into v_row;

  insert into public.integration_events (integracao_id, event_type, status, summary)
  values (v_row.id, 'configuracao_salva', 'sucesso', 'Configuração salva pelo administrador.');

  return jsonb_build_object('ok', true, 'id', v_row.id, 'provider', v_row.provider, 'status', v_row.status);
end;
$$;

-- RPC: registrar resultado de teste de conexão (admin only)
create or replace function public.admin_testar_integracao(
  p_provider text,
  p_sucesso boolean,
  p_erro text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.integracoes%rowtype;
  v_status text;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Acesso negado';
  end if;

  v_status := case when p_sucesso then 'conectada' else 'erro' end;

  update public.integracoes
  set status = v_status,
      last_tested_at = now(),
      last_error = case when p_sucesso then null else p_erro end,
      updated_at = now()
  where provider = p_provider
    and (organizacao_id is null)
  returning * into v_row;

  if v_row.id is null then
    raise exception 'Integração não configurada: %', p_provider;
  end if;

  insert into public.integration_events (integracao_id, event_type, status, summary, error)
  values (
    v_row.id,
    'teste_conexao',
    case when p_sucesso then 'sucesso' else 'falha' end,
    case when p_sucesso then 'Teste de conexão bem-sucedido.' else 'Teste de conexão falhou.' end,
    case when p_sucesso then null else p_erro end
  );

  return jsonb_build_object('ok', true, 'provider', v_row.provider, 'status', v_row.status, 'last_error', v_row.last_error);
end;
$$;

-- RPC: desconectar integração (admin only)
create or replace function public.admin_desconectar_integracao(
  p_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.integracoes%rowtype;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Acesso negado';
  end if;

  update public.integracoes
  set status = 'desconectada',
      config = '{}'::jsonb,
      last_error = null,
      updated_at = now()
  where provider = p_provider
    and (organizacao_id is null)
  returning * into v_row;

  if v_row.id is null then
    return jsonb_build_object('ok', true, 'provider', p_provider, 'status', 'nao_configurada');
  end if;

  insert into public.integration_events (integracao_id, event_type, status, summary)
  values (v_row.id, 'desconexao', 'sucesso', 'Integração desconectada pelo administrador.');

  return jsonb_build_object('ok', true, 'provider', v_row.provider, 'status', v_row.status);
end;
$$;

-- RPC: listar integrações (admin/comercial)
create or replace function public.admin_listar_integracoes()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_result jsonb;
begin
  if v_role is null or v_role not in ('admin', 'comercial') then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'provider', i.provider,
      'status', i.status,
      'config', i.config,
      'last_tested_at', i.last_tested_at,
      'last_error', i.last_error,
      'created_at', i.created_at,
      'updated_at', i.updated_at
    ) order by i.provider
  ), '[]'::jsonb)
  into v_result
  from public.integracoes i
  where i.organizacao_id is null;

  return v_result;
end;
$$;

grant execute on function public.admin_salvar_integracao(text, jsonb) to authenticated;
grant execute on function public.admin_testar_integracao(text, boolean, text) to authenticated;
grant execute on function public.admin_desconectar_integracao(text) to authenticated;
grant execute on function public.admin_listar_integracoes() to authenticated;

comment on table public.integracoes is 'Configurações de integrações do Connect Hub. Uma integração só é "conectada" após teste real bem-sucedido.';
comment on table public.integration_events is 'Histórico de eventos das integrações (configuração, teste, desconexão, falhas).';


-- FIM: 0017_integracoes.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0018_automacoes.sql
-- ----------------------------------------------------------------------------

-- 0018_automacoes.sql
-- Estrutura para o Automation Studio — Estar On Indica 4.0.
-- Fluxos de automação com nós, arestas, execuções e logs.
-- Simulação não executa ações reais; apenas registra o que seria feito.

create table if not exists public.automation_flows (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  ativo boolean not null default false,
  trigger_type text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_nodes (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  node_type text not null,
  label text not null,
  config jsonb not null default '{}'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_edges (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  from_node uuid references public.automation_nodes(id) on delete cascade,
  to_node uuid references public.automation_nodes(id) on delete cascade,
  condition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  status text not null check (status in ('simulado', 'sucesso', 'falha', 'em_execucao')),
  trigger_payload jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.automation_executions(id) on delete cascade,
  node_id uuid references public.automation_nodes(id) on delete set null,
  node_type text not null,
  status text not null check (status in ('simulado', 'sucesso', 'falha', 'ignorado')),
  message text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists automation_nodes_flow_idx on public.automation_nodes (flow_id, position);
create index if not exists automation_executions_flow_idx on public.automation_executions (flow_id, started_at desc);
create index if not exists automation_logs_execution_idx on public.automation_logs (execution_id, created_at);

alter table public.automation_flows enable row level security;
alter table public.automation_nodes enable row level security;
alter table public.automation_edges enable row level security;
alter table public.automation_executions enable row level security;
alter table public.automation_logs enable row level security;

-- Leitura: admin e comercial
drop policy if exists automation_flows_select on public.automation_flows;
create policy automation_flows_select on public.automation_flows
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists automation_nodes_select on public.automation_nodes;
create policy automation_nodes_select on public.automation_nodes
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists automation_edges_select on public.automation_edges;
create policy automation_edges_select on public.automation_edges
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists automation_executions_select on public.automation_executions;
create policy automation_executions_select on public.automation_executions
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists automation_logs_select on public.automation_logs;
create policy automation_logs_select on public.automation_logs
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin (via RLS, sem service_role no frontend)
drop policy if exists automation_flows_write on public.automation_flows;
create policy automation_flows_write on public.automation_flows
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists automation_nodes_write on public.automation_nodes;
create policy automation_nodes_write on public.automation_nodes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists automation_edges_write on public.automation_edges;
create policy automation_edges_write on public.automation_edges
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists automation_executions_write on public.automation_executions;
create policy automation_executions_write on public.automation_executions
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists automation_logs_write on public.automation_logs;
create policy automation_logs_write on public.automation_logs
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- RPC: simular execução de um fluxo (não executa ações reais)
create or replace function public.admin_simular_fluxo(p_flow_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_flow public.automation_flows%rowtype;
  v_exec public.automation_executions%rowtype;
  v_node record;
  v_msg text;
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select * into v_flow from public.automation_flows where id = p_flow_id;
  if v_flow.id is null then
    raise exception 'Fluxo não encontrado';
  end if;

  insert into public.automation_executions (flow_id, status, trigger_payload)
  values (p_flow_id, 'simulado', jsonb_build_object('simulado_por', v_actor, 'modo', 'dry_run'))
  returning * into v_exec;

  for v_node in
    select * from public.automation_nodes
    where flow_id = p_flow_id
    order by position asc, created_at asc
  loop
    v_msg := case v_node.node_type
      when 'gatilho' then 'Gatilho detectado: ' || coalesce(v_node.config->>'evento', v_node.label)
      when 'condicao' then 'Condição avaliada: ' || coalesce(v_node.config->>'regra', v_node.label)
      when 'acao' then 'Ação que seria executada: ' || coalesce(v_node.config->>'acao', v_node.label)
      when 'espera' then 'Aguardaria: ' || coalesce(v_node.config->>'duracao', v_node.label)
      when 'notificacao' then 'Notificação que seria enviada: ' || coalesce(v_node.config->>'canal', v_node.label)
      when 'consulta' then 'Consulta que seria realizada: ' || coalesce(v_node.config->>'alvo', v_node.label)
      when 'integracao' then 'Integração que seria chamada: ' || coalesce(v_node.config->>'provider', v_node.label)
      when 'atualizacao' then 'Atualização que seria aplicada: ' || coalesce(v_node.config->>'campo', v_node.label)
      else 'Nó processado: ' || v_node.label
    end;

    insert into public.automation_logs (execution_id, node_id, node_type, status, message)
    values (v_exec.id, v_node.id, v_node.node_type, 'simulado', v_msg);
  end loop;

  update public.automation_executions
  set status = 'sucesso', finished_at = now()
  where id = v_exec.id;

  return jsonb_build_object('ok', true, 'execution_id', v_exec.id, 'nodes', (
    select count(*) from public.automation_nodes where flow_id = p_flow_id
  ));
end;
$$;

grant execute on function public.admin_simular_fluxo(uuid) to authenticated;

comment on table public.automation_flows is 'Fluxos de automação do Automation Studio. Simulação não executa ações reais.';
comment on table public.automation_executions is 'Execuções (reais ou simuladas) de fluxos de automação.';
comment on table public.automation_logs is 'Logs detalhados de cada execução de fluxo.';


-- FIM: 0018_automacoes.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0019_rewards_engine.sql
-- ----------------------------------------------------------------------------

-- 0019_rewards_engine.sql
-- Estrutura para o Rewards Engine — Estar On Indica 4.0.
-- Pontuação, níveis, conquistas, metas e ranking de participantes.
-- Preserva as regras atuais de recompensas (tabela rewards existente não é alterada).

-- Níveis de participantes
create table if not exists public.niveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  pontos_minimos int not null default 0,
  cor text not null default '#D2DD3A',
  icone text not null default 'star',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conquistas
create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  icone text not null default 'trophy',
  cor text not null default '#D2DD3A',
  criterio text not null,
  pontos_recompensa int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pontos dos participantes
create table if not exists public.participante_pontos (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  pontos int not null default 0,
  nivel_id uuid references public.niveis(id),
  updated_at timestamptz not null default now(),
  unique (participante_id)
);

-- Conquistas desbloqueadas
create table if not exists public.participante_conquistas (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  conquista_id uuid not null references public.conquistas(id) on delete cascade,
  desbloqueada_em timestamptz not null default now(),
  unique (participante_id, conquista_id)
);

-- Metas individuais
create table if not exists public.metas_participante (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  descricao text,
  meta_valor int not null default 1,
  progresso int not null default 0,
  tipo text not null default 'indicacoes',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists niveis_ordem_idx on public.niveis (ordem);
create index if not exists conquistas_ativo_idx on public.conquistas (ativo);
create index if not exists participante_pontos_participante_idx on public.participante_pontos (participante_id);
create index if not exists participante_conquistas_participante_idx on public.participante_conquistas (participante_id);
create index if not exists metas_participante_participante_idx on public.metas_participante (participante_id);

alter table public.niveis enable row level security;
alter table public.conquistas enable row level security;
alter table public.participante_pontos enable row level security;
alter table public.participante_conquistas enable row level security;
alter table public.metas_participante enable row level security;

-- Leitura: todos autenticados podem ver níveis e conquistas (catálogo)
drop policy if exists niveis_select_all on public.niveis;
create policy niveis_select_all on public.niveis
  for select to authenticated using (true);

drop policy if exists conquistas_select_all on public.conquistas;
create policy conquistas_select_all on public.conquistas
  for select to authenticated using (true);

-- Pontos: participante vê os próprios; staff vê todos
drop policy if exists participante_pontos_select_own on public.participante_pontos;
create policy participante_pontos_select_own on public.participante_pontos
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists participante_conquistas_select_own on public.participante_conquistas;
create policy participante_conquistas_select_own on public.participante_conquistas
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists metas_select_own on public.metas_participante;
create policy metas_select_own on public.metas_participante
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin (via RLS), leitura para todos
drop policy if exists niveis_write_admin on public.niveis;
create policy niveis_write_admin on public.niveis
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists conquistas_write_admin on public.conquistas;
create policy conquistas_write_admin on public.conquistas
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists participante_pontos_write_admin on public.participante_pontos;
create policy participante_pontos_write_admin on public.participante_pontos
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists participante_conquistas_write_admin on public.participante_conquistas;
create policy participante_conquistas_write_admin on public.participante_conquistas
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists metas_write_admin on public.metas_participante;
create policy metas_write_admin on public.metas_participante
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- RPC: obter perfil de gamificação do participante atual
create or replace function public.get_meu_perfil_gamificacao()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_pontos public.participante_pontos%rowtype;
  v_nivel public.niveis%rowtype;
  v_conquistas jsonb;
  v_metas jsonb;
  v_ranking int;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_pontos from public.participante_pontos where participante_id = v_user;
  if v_pontos.id is null then
    insert into public.participante_pontos (participante_id, pontos) values (v_user, 0)
    returning * into v_pontos;
  end if;

  if v_pontos.nivel_id is not null then
    select * into v_nivel from public.niveis where id = v_pontos.nivel_id;
  else
    select * into v_nivel from public.niveis where ativo = true order by pontos_minimos asc limit 1;
    if v_nivel.id is not null then
      update public.participante_pontos set nivel_id = v_nivel.id where participante_id = v_user;
    end if;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'nome', c.nome,
      'descricao', c.descricao,
      'icone', c.icone,
      'cor', c.cor,
      'pontos_recompensa', c.pontos_recompensa,
      'desbloqueada_em', pc.desbloqueada_em
    ) order by pc.desbloqueada_em desc
  ), '[]'::jsonb)
  into v_conquistas
  from public.participante_conquistas pc
  join public.conquistas c on c.id = pc.conquista_id
  where pc.participante_id = v_user;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'titulo', m.titulo,
      'descricao', m.descricao,
      'meta_valor', m.meta_valor,
      'progresso', m.progresso,
      'tipo', m.tipo
    ) order by m.created_at desc
  ), '[]'::jsonb)
  into v_metas
  from public.metas_participante m
  where m.participante_id = v_user and m.ativo = true;

  select count(*)::int + 1 into v_ranking
  from public.participante_pontos pp
  where pp.pontos > v_pontos.pontos;

  return jsonb_build_object(
    'pontos', v_pontos.pontos,
    'nivel', case when v_nivel.id is null then null else jsonb_build_object(
      'id', v_nivel.id,
      'nome', v_nivel.nome,
      'descricao', v_nivel.descricao,
      'pontos_minimos', v_nivel.pontos_minimos,
      'cor', v_nivel.cor,
      'icone', v_nivel.icone
    ) end,
    'proximo_nivel', (
      select jsonb_build_object(
        'id', n.id,
        'nome', n.nome,
        'pontos_minimos', n.pontos_minimos,
        'cor', n.cor
      )
      from public.niveis n
      where n.ativo = true and n.pontos_minimos > v_pontos.pontos
      order by n.pontos_minimos asc
      limit 1
    ),
    'conquistas', v_conquistas,
    'metas', v_metas,
    'ranking', v_ranking
  );
end;
$$;

-- RPC: listar ranking de participantes (top N)
create or replace function public.listar_ranking_participantes(p_limit int default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_result jsonb;
begin
  if v_role is null then
    raise exception 'Não autenticado';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'participante_id', pp.participante_id,
      'nome', p.nome_completo,
      'pontos', pp.pontos,
      'nivel', n.nome,
      'nivel_cor', n.cor
    ) order by pp.pontos desc, p.nome_completo
  ), '[]'::jsonb)
  into v_result
  from public.participante_pontos pp
  join public.profiles p on p.id = pp.participante_id
  left join public.niveis n on n.id = pp.nivel_id
  where p.tipo_usuario = 'indicador'
  limit p_limit;

  return v_result;
end;
$$;

-- RPC: listar níveis (catálogo)
create or replace function public.listar_niveis()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'nome', n.nome,
      'descricao', n.descricao,
      'pontos_minimos', n.pontos_minimos,
      'cor', n.cor,
      'icone', n.icone,
      'ordem', n.ordem,
      'ativo', n.ativo
    ) order by n.ordem asc, n.pontos_minimos asc
  ), '[]'::jsonb)
  from public.niveis n
  where n.ativo = true;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'nome', n.nome,
        'descricao', n.descricao,
        'pontos_minimos', n.pontos_minimos,
        'cor', n.cor,
        'icone', n.icone,
        'ordem', n.ordem,
        'ativo', n.ativo
      ) order by n.ordem asc, n.pontos_minimos asc
    )
    from public.niveis n
    where n.ativo = true
  ), '[]'::jsonb);
end;
$$;

-- RPC: listar conquistas (catálogo)
create or replace function public.listar_conquistas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'nome', c.nome,
        'descricao', c.descricao,
        'icone', c.icone,
        'cor', c.cor,
        'criterio', c.criterio,
        'pontos_recompensa', c.pontos_recompensa,
        'ativo', c.ativo
      ) order by c.nome
    )
    from public.conquistas c
    where c.ativo = true
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.get_meu_perfil_gamificacao() to authenticated;
grant execute on function public.listar_ranking_participantes(int) to authenticated;
grant execute on function public.listar_niveis() to authenticated;
grant execute on function public.listar_conquistas() to authenticated;

comment on table public.niveis is 'Níveis de gamificação dos participantes (Rewards Engine).';
comment on table public.conquistas is 'Conquistas desbloqueáveis pelos participantes.';
comment on table public.participante_pontos is 'Saldo de pontos e nível atual de cada participante.';
comment on table public.participante_conquistas is 'Conquistas desbloqueadas por participante.';
comment on table public.metas_participante is 'Metas individuais de participantes.';


-- FIM: 0019_rewards_engine.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0020_multi_tenancy_prep.sql
-- ----------------------------------------------------------------------------

-- 0020_multi_tenancy_prep.sql
-- Preparação para multi-tenancy (Estar On Indica 4.0).
-- Adiciona organizacao_id (nullable) às tabelas principais.
-- NÃO ativa multi-tenancy: organizacao_id = null = modo single-tenant (atual).
-- Migração não-destrutiva: todas as colunas são nullable com default null.

-- Tabela de organizações
create table if not exists public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  logo_url text,
  cor_primaria text default '#D2DD3A',
  cor_secundaria text default '#31393F',
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas organizacao_id (nullable) nas tabelas principais
alter table public.profiles add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.referrals add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.rewards add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.campaigns add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.settings add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.integracoes add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.automation_flows add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.niveis add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.conquistas add column if not exists organizacao_id uuid references public.organizacoes(id);

-- Índices
create index if not exists profiles_org_idx on public.profiles (organizacao_id);
create index if not exists referrals_org_idx on public.referrals (organizacao_id);
create index if not exists rewards_org_idx on public.rewards (organizacao_id);
create index if not exists campaigns_org_idx on public.campaigns (organizacao_id);
create index if not exists settings_org_idx on public.settings (organizacao_id);

-- Helper: organização atual do usuário (null em modo single-tenant)
create or replace function private.organizacao_atual()
returns uuid
language sql
stable
security definer
set search_path = public, private
as $$
  select p.organizacao_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

-- RLS: em modo single-tenant (organizacao_id null), acesso irrestrito como antes.
-- Quando organizacao_id estiver preenchido, filtrar por organização.
-- As policies existentes continuam válidas; as novas são ADICIONAIS (não removem as atuais).

-- Organizações: leitura para autenticados, escrita apenas admin
alter table public.organizacoes enable row level security;

drop policy if exists organizacoes_select on public.organizacoes;
create policy organizacoes_select on public.organizacoes
  for select to authenticated using (true);

drop policy if exists organizacoes_write_admin on public.organizacoes;
create policy organizacoes_write_admin on public.organizacoes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

grant select on table public.organizacoes to authenticated;
grant insert, update, delete on table public.organizacoes to authenticated;

comment on table public.organizacoes is 'Organizações (multi-tenant prep). Em modo single-tenant, organizacao_id = null em todas as tabelas.';
comment on column public.profiles.organizacao_id is 'Organização do perfil. Null = modo single-tenant (atual).';


-- FIM: 0020_multi_tenancy_prep.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0021_banners_carrossel.sql
-- ----------------------------------------------------------------------------

-- 0021_banners_carrossel.sql
-- Tabela de banners para o Hero Carousel (Estar On Indica 5.0).
-- Status: rascunho, agendado, publicado, expirado, desativado.

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_url text not null,
  link_url text,
  botao_texto text,
  data_inicio timestamptz,
  data_fim timestamptz,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_ordem_idx on public.banners (ordem, created_at);
create index if not exists banners_ativo_idx on public.banners (ativo, data_inicio, data_fim);

alter table public.banners enable row level security;

-- Leitura: todos (banners publicados e vigentes)
drop policy if exists banners_select_public on public.banners;
create policy banners_select_public
  on public.banners
  for select
  to anon, authenticated
  using (
    ativo = true
    and (data_inicio is null or data_inicio <= now())
    and (data_fim is null or data_fim >= now())
  );

-- Leitura admin: todos os banners (inclusive rascunhos/expirados)
drop policy if exists banners_select_admin on public.banners;
create policy banners_select_admin
  on public.banners
  for select
  to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin
drop policy if exists banners_write_admin on public.banners;
create policy banners_write_admin
  on public.banners
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Storage bucket para imagens de banners
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Storage policies: leitura pública, escrita apenas admin
drop policy if exists banners_storage_select on storage.objects;
create policy banners_storage_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'banners');

drop policy if exists banners_storage_insert on storage.objects;
create policy banners_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'banners' and private.is_admin());

drop policy if exists banners_storage_update on storage.objects;
create policy banners_storage_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'banners' and private.is_admin())
  with check (bucket_id = 'banners' and private.is_admin());

drop policy if exists banners_storage_delete on storage.objects;
create policy banners_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'banners' and private.is_admin());

comment on table public.banners is 'Banners do Hero Carousel (Estar On Indica 5.0). Uma integração só é publicada após configuração real.';

-- Seed: banner oficial da campanha (visível por padrão no carrossel).
-- Inserido apenas se a tabela estiver vazia, para não duplicar.
insert into public.banners (titulo, descricao, imagem_url, link_url, botao_texto, ativo, ordem)
select
  'Indique e Ganhe R$ 50',
  'Indique o melhor provedor de internet da região e ganhe R$ 50 por cada amigo que contratar a Estar On!',
  '/branding/indique-ganhe-banner.png',
  '/cadastro',
  'Quero participar',
  true,
  0
where not exists (select 1 from public.banners);


-- FIM: 0021_banners_carrossel.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0022_beneficios.sql
-- ----------------------------------------------------------------------------

-- 0022_beneficios.sql
-- Tabela de benefícios para a central ON Benefits (Estar On Indica 5.0).

create table if not exists public.beneficios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_url text,
  regulamento text,
  condicoes text,
  data_inicio timestamptz,
  data_fim timestamptz,
  ativo boolean not null default true,
  ordem int not null default 0,
  link_url text,
  botao_texto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beneficios_ordem_idx on public.beneficios (ordem, created_at);
create index if not exists beneficios_ativo_idx on public.beneficios (ativo, data_inicio, data_fim);

alter table public.beneficios enable row level security;

-- Leitura: todos (benefícios publicados e vigentes)
drop policy if exists beneficios_select_public on public.beneficios;
create policy beneficios_select_public
  on public.beneficios
  for select
  to anon, authenticated
  using (
    ativo = true
    and (data_inicio is null or data_inicio <= now())
    and (data_fim is null or data_fim >= now())
  );

-- Leitura admin: todos
drop policy if exists beneficios_select_admin on public.beneficios;
create policy beneficios_select_admin
  on public.beneficios
  for select
  to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin
drop policy if exists beneficios_write_admin on public.beneficios;
create policy beneficios_write_admin
  on public.beneficios
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

comment on table public.beneficios is 'Benefícios exclusivos para clientes Estar On (ON Benefits).';


-- FIM: 0022_beneficios.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0023_smart_followup_saude.sql
-- ----------------------------------------------------------------------------

-- 0023_smart_followup_saude.sql
-- Estar On Smart Follow-Up + Central de Saúde do Sistema (Estar On Indica 6.0).

-- 1) Colunas de acompanhamento nas indicações
alter table public.referrals
  add column if not exists last_status_change_at timestamptz default now(),
  add column if not exists followup_level int not null default 0,
  add column if not exists followup_resolved boolean not null default false;

create index if not exists referrals_followup_idx
  on public.referrals (followup_resolved, last_status_change_at)
  where followup_resolved = false;

-- 2) Tabela de alertas de follow-up
create table if not exists public.followup_alerts (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  nivel int not null check (nivel in (1, 2)),
  mensagem text not null,
  resolvido boolean not null default false,
  resolvido_em timestamptz,
  resolvido_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists followup_alerts_referral_idx on public.followup_alerts (referral_id, created_at desc);
create index if not exists followup_alerts_resolvido_idx on public.followup_alerts (resolvido, created_at desc);

alter table public.followup_alerts enable row level security;

drop policy if exists followup_alerts_select on public.followup_alerts;
create policy followup_alerts_select on public.followup_alerts
  for select to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists followup_alerts_write on public.followup_alerts;
create policy followup_alerts_write on public.followup_alerts
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- 3) Função de processamento (pode ser chamada via cron ou manualmente)
create or replace function public.processar_smart_followup()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_alertas_24h int := 0;
  v_alertas_48h int := 0;
  v_resolvidos int := 0;
  r record;
begin
  -- Resolver alertas de indicações concluídas/canceladas
  update public.followup_alerts fa
  set resolvido = true, resolvido_em = now()
  from public.referrals r
  where fa.referral_id = r.id
    and fa.resolvido = false
    and r.status in ('instalado', 'instalacao_realizada', 'bonificacao_paga', 'cancelado', 'cancelada', 'reprovado', 'reprovada', 'nao_atendemos_regiao', 'sem_viabilidade_tecnica');

  get diagnostics v_resolvidos = row_count;

  -- Marcar followup_resolved nas indicações concluídas
  update public.referrals
  set followup_resolved = true
  where followup_resolved = false
    and status in ('instalado', 'instalacao_realizada', 'bonificacao_paga', 'cancelado', 'cancelada', 'reprovado', 'reprovada', 'nao_atendemos_regiao', 'sem_viabilidade_tecnica');

  -- Alertas de 24h (nível 1)
  for r in
    select id from public.referrals
    where followup_resolved = false
      and followup_level = 0
      and last_status_change_at < now() - interval '24 hours'
      and status not in ('instalado', 'instalacao_realizada', 'bonificacao_paga', 'cancelado', 'cancelada', 'reprovado', 'reprovada', 'nao_atendemos_regiao', 'sem_viabilidade_tecnica')
  loop
    insert into public.followup_alerts (referral_id, nivel, mensagem)
    values (r.id, 1, 'Indicação sem atualização há mais de 24 horas. Verifique o andamento.');

    update public.referrals set followup_level = 1 where id = r.id;
    v_alertas_24h := v_alertas_24h + 1;
  end loop;

  -- Alertas de 48h (nível 2)
  for r in
    select id from public.referrals
    where followup_resolved = false
      and followup_level = 1
      and last_status_change_at < now() - interval '48 hours'
      and status not in ('instalado', 'instalacao_realizada', 'bonificacao_paga', 'cancelado', 'cancelada', 'reprovado', 'reprovada', 'nao_atendemos_regiao', 'sem_viabilidade_tecnica')
  loop
    insert into public.followup_alerts (referral_id, nivel, mensagem)
    values (r.id, 2, 'Indicação sem atualização há mais de 48 horas. Acompanhamento urgente necessário.');

    update public.referrals set followup_level = 2 where id = r.id;
    v_alertas_48h := v_alertas_48h + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'alertas_24h', v_alertas_24h,
    'alertas_48h', v_alertas_48h,
    'resolvidos', v_resolvidos,
    'executado_em', now()
  );
end;
$$;

-- RPC: listar alertas ativos
create or replace function public.listar_followup_alerts(p_limit int default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_result jsonb;
begin
  if v_role is null or v_role not in ('admin', 'comercial') then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', fa.id,
      'referral_id', fa.referral_id,
      'nivel', fa.nivel,
      'mensagem', fa.mensagem,
      'resolvido', fa.resolvido,
      'created_at', fa.created_at,
      'indicado_nome', r.indicado_nome,
      'status', r.status::text
    ) order by fa.created_at desc
  ), '[]'::jsonb)
  into v_result
  from public.followup_alerts fa
  join public.referrals r on r.id = fa.referral_id
  where fa.resolvido = false
  limit greatest(1, least(p_limit, 100));

  return v_result;
end;
$$;

-- RPC: resolver alerta manualmente
create or replace function public.resolver_followup_alerta(p_alert_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not private.is_admin() then
    raise exception 'Acesso negado';
  end if;

  update public.followup_alerts
  set resolvido = true, resolvido_em = now(), resolvido_por = v_actor
  where id = p_alert_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.processar_smart_followup() to authenticated;
grant execute on function public.listar_followup_alerts(int) to authenticated;
grant execute on function public.resolver_followup_alerta(uuid) to authenticated;

comment on table public.followup_alerts is 'Alertas de acompanhamento automático de indicações (Smart Follow-Up).';
comment on function public.processar_smart_followup() is 'Processa alertas de follow-up. Chamar via cron (pg_cron) ou manualmente.';


-- FIM: 0023_smart_followup_saude.sql

-- ----------------------------------------------------------------------------
-- INICIO: 0024_fix_smart_followup.sql
-- ----------------------------------------------------------------------------

-- 0024_fix_smart_followup.sql
-- Corrige o erro "record \"r\" is not assigned yet" na funcao de follow-up.
--
-- Causa raiz: no UPDATE ... FROM public.referrals r, o alias de tabela "r"
-- colidia com a variavel record "r" do PL/pgSQL. Como a variavel ainda nao
-- havia sido atribuida, o PostgreSQL abortava a execucao inteira.
--
-- Correcao: renomear a variavel record para v_ref e o alias para ref.

create or replace function public.processar_smart_followup()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_alertas_24h int := 0;
  v_alertas_48h int := 0;
  v_resolvidos int := 0;
  v_ref record;
begin
  -- pg_cron executa sem auth.uid(); nesse caso a rotina e permitida.
  -- Usuario comum autenticado nao pode disparar o processamento.
  if auth.uid() is not null
     and not (private.is_admin() or private.tipo_usuario_atual() = 'comercial') then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO';
  end if;

  -- Resolver alertas de indicacoes concluidas/canceladas
  update public.followup_alerts fa
  set resolvido = true, resolvido_em = now()
  from public.referrals ref
  where fa.referral_id = ref.id
    and fa.resolvido = false
    and ref.status in (
      'instalado', 'instalacao_realizada', 'bonificacao_paga',
      'cancelado', 'cancelada', 'reprovado', 'reprovada',
      'nao_atendemos_regiao', 'sem_viabilidade_tecnica'
    );

  get diagnostics v_resolvidos = row_count;

  -- Marcar followup_resolved nas indicacoes concluidas
  update public.referrals
  set followup_resolved = true
  where followup_resolved = false
    and status in (
      'instalado', 'instalacao_realizada', 'bonificacao_paga',
      'cancelado', 'cancelada', 'reprovado', 'reprovada',
      'nao_atendemos_regiao', 'sem_viabilidade_tecnica'
    );

  -- Alertas de 24h (nivel 1)
  for v_ref in
    select id from public.referrals
    where followup_resolved = false
      and followup_level = 0
      and last_status_change_at < now() - interval '24 hours'
      and status not in (
        'instalado', 'instalacao_realizada', 'bonificacao_paga',
        'cancelado', 'cancelada', 'reprovado', 'reprovada',
        'nao_atendemos_regiao', 'sem_viabilidade_tecnica'
      )
  loop
    insert into public.followup_alerts (referral_id, nivel, mensagem)
    values (v_ref.id, 1, 'Indicacao sem atualizacao ha mais de 24 horas. Verifique o andamento.');

    update public.referrals set followup_level = 1 where id = v_ref.id;
    v_alertas_24h := v_alertas_24h + 1;
  end loop;

  -- Alertas de 48h (nivel 2)
  for v_ref in
    select id from public.referrals
    where followup_resolved = false
      and followup_level = 1
      and last_status_change_at < now() - interval '48 hours'
      and status not in (
        'instalado', 'instalacao_realizada', 'bonificacao_paga',
        'cancelado', 'cancelada', 'reprovado', 'reprovada',
        'nao_atendemos_regiao', 'sem_viabilidade_tecnica'
      )
  loop
    insert into public.followup_alerts (referral_id, nivel, mensagem)
    values (v_ref.id, 2, 'Indicacao sem atualizacao ha mais de 48 horas. Acompanhamento urgente necessario.');

    update public.referrals set followup_level = 2 where id = v_ref.id;
    v_alertas_48h := v_alertas_48h + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'alertas_24h', v_alertas_24h,
    'alertas_48h', v_alertas_48h,
    'resolvidos', v_resolvidos,
    'executado_em', now()
  );
end;
$$;

-- RPC de diagnostico: informa se o pg_cron esta habilitado, se o job existe,
-- se esta ativo e qual foi o resultado da ultima execucao.
create or replace function public.saude_cron_status()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_job record;
  v_run record;
begin
  if not private.is_admin() then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO';
  end if;

  if to_regclass('cron.job') is null then
    return jsonb_build_object('pg_cron', false, 'job_existe', false, 'ativo', false);
  end if;

  select jobid, jobname, schedule, active
  into v_job
  from cron.job
  where jobname = 'estar-on-smart-followup'
     or command ilike '%processar_smart_followup%'
  order by (jobname = 'estar-on-smart-followup') desc
  limit 1;

  if v_job.jobid is null then
    return jsonb_build_object('pg_cron', true, 'job_existe', false, 'ativo', false);
  end if;

  select status, return_message, start_time
  into v_run
  from cron.job_run_details
  where jobid = v_job.jobid
  order by start_time desc
  limit 1;

  return jsonb_build_object(
    'pg_cron', true,
    'job_existe', true,
    'ativo', v_job.active,
    'agenda', v_job.schedule,
    'ultima_execucao', v_run.start_time,
    'ultimo_status', v_run.status,
    'ultima_mensagem', v_run.return_message
  );
end;
$$;

grant execute on function public.processar_smart_followup() to authenticated;
grant execute on function public.saude_cron_status() to authenticated;

comment on function public.processar_smart_followup() is
  'Processa alertas de follow-up. Corrigida na 0024 (conflito de alias/variável).';
comment on function public.saude_cron_status() is
  'Diagnóstico do agendamento pg_cron do Smart Follow-Up (apenas admin).';


-- FIM: 0024_fix_smart_followup.sql

