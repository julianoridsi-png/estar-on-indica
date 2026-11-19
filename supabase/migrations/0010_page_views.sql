-- ============================================================================
-- 0010_page_views.sql
-- Rastreamento de acessos para relatórios do painel administrativo.
-- ============================================================================
create table if not exists public.page_views (
  id bigserial primary key,
  path text not null,
  user_id uuid references public.profiles (id) on delete set null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_page_views_path on public.page_views (path);
create index if not exists idx_page_views_created_at on public.page_views (created_at desc);
create index if not exists idx_page_views_user on public.page_views (user_id);

alter table public.page_views enable row level security;

-- Indicadores podem registrar suas próprias visualizações
drop policy if exists page_views_insert_own on public.page_views;
create policy page_views_insert_own
  on public.page_views
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- Apenas staff pode consultar
drop policy if exists page_views_select_staff on public.page_views;
create policy page_views_select_staff
  on public.page_views
  for select
  to authenticated
  using (private.is_staff());

grant insert, select on table public.page_views to authenticated;

-- RPC: estatísticas de acesso
create or replace function public.get_access_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff boolean := private.is_staff();
  v_resultado jsonb;
begin
  if not v_staff then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: estatísticas de acesso são restritas à equipe.';
  end if;

  select jsonb_build_object(
    'total_views', (select count(*) from public.page_views),
    'views_hoje', (select count(*) from public.page_views where created_at >= date_trunc('day', now())),
    'views_7dias', (select count(*) from public.page_views where created_at >= now() - interval '7 days'),
    'views_30dias', (select count(*) from public.page_views where created_at >= now() - interval '30 days'),
    'top_paginas', coalesce((
      select jsonb_agg(item order by (item->>'total')::int desc)
      from (
        select jsonb_build_object('path', path, 'total', count(*)) as item
        from public.page_views
        group by path
        order by count(*) desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'acessos_por_dia', coalesce((
      select jsonb_agg(item order by (item->>'dia')::text)
      from (
        select jsonb_build_object(
          'dia', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
          'total', count(*)
        ) as item
        from public.page_views
        where created_at >= now() - interval '14 days'
        group by date_trunc('day', created_at)
        order by date_trunc('day', created_at)
      ) t
    ), '[]'::jsonb)
  )
  into v_resultado;

  return v_resultado;
end;
$$;

revoke execute on function public.get_access_stats() from public;
grant execute on function public.get_access_stats() to authenticated;