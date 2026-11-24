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
