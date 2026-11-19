-- ============================================================================
-- 0015_notificacoes.sql
-- Estrutura de notificações internas.
-- ============================================================================
create table if not exists public.notifications (
  id bigserial primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_notifications_lida on public.notifications (lida);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_staff());

drop policy if exists notifications_insert_staff on public.notifications;
create policy notifications_insert_staff
  on public.notifications
  for insert
  to authenticated
  with check (private.is_staff());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on table public.notifications to authenticated;

-- RPC: listar notificações do usuário
create or replace function public.get_minhas_notificacoes(p_limit int default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_resultado jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO: faça login.';
  end if;

  select coalesce(jsonb_agg(item order by (item->>'created_at')::timestamptz desc), '[]'::jsonb)
  into v_resultado
  from (
    select jsonb_build_object(
      'id', n.id,
      'tipo', n.tipo,
      'titulo', n.titulo,
      'mensagem', n.mensagem,
      'lida', n.lida,
      'link', n.link,
      'created_at', n.created_at
    ) as item
    from public.notifications n
    where n.user_id = v_uid or n.user_id is null
    order by n.created_at desc
    limit greatest(1, least(p_limit, 100))
  ) t;

  return v_resultado;
end;
$$;

revoke execute on function public.get_minhas_notificacoes(int) from public;
grant execute on function public.get_minhas_notificacoes(int) to authenticated;

-- RPC: marcar notificação como lida
create or replace function public.marcar_notificacao_lida(p_id bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'ACESSO_NEGADO: faça login.';
  end if;

  update public.notifications
  set lida = true
  where id = p_id and (user_id = v_uid or user_id is null);

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.marcar_notificacao_lida(bigint) from public;
grant execute on function public.marcar_notificacao_lida(bigint) to authenticated;