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
