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
