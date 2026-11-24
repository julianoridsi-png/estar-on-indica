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
  -- O SQL Editor e o pg_cron executam sem auth.uid(); nesse caso a rotina e
  -- permitida. Usuario comum autenticado nao pode ver o diagnostico.
  if auth.uid() is not null and not private.is_admin() then
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

-- Acesso as RPCs: somente usuarios autenticados (admin) e service_role.
-- O cron roda como postgres e nao depende destes grants.
revoke execute on function public.processar_smart_followup() from public, anon;
revoke execute on function public.saude_cron_status() from public, anon;
grant execute on function public.processar_smart_followup() to authenticated, service_role;
grant execute on function public.saude_cron_status() to authenticated, service_role;

comment on function public.processar_smart_followup() is
  'Processa alertas de follow-up. Corrigida na 0024 (conflito de alias/variável).';
comment on function public.saude_cron_status() is
  'Diagnóstico do agendamento pg_cron do Smart Follow-Up (apenas admin).';
