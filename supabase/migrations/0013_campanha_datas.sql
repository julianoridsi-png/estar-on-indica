-- ============================================================================
-- 0013_campanha_datas.sql
-- Adiciona datas de início/encerramento da campanha e RPC com filtro por período.
-- ============================================================================
alter table public.settings
  add column if not exists campanha_data_inicio date,
  add column if not exists campanha_data_fim date,
  add column if not exists campanha_ativa boolean not null default true;

-- Atualiza get_admin_stats para aceitar filtro por período (opcional)
create or replace function public.get_admin_stats(
  p_data_inicio date default null,
  p_data_fim date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_staff boolean := private.is_staff();
  v_inicio timestamptz := coalesce(p_data_inicio::timestamptz, '-infinity'::timestamptz);
  v_fim timestamptz := coalesce((p_data_fim + interval '1 day')::timestamptz, 'infinity'::timestamptz);
  v_resultado jsonb;
begin
  if not v_staff then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: esta visão é restrita à equipe Estar On.';
  end if;

  select jsonb_build_object(
    'total_indicadores', (select count(*) from public.profiles where tipo_usuario = 'indicador'),
    'total_indicacoes', (select count(*) from public.referrals where created_at >= v_inicio and created_at < v_fim),
    'contratos_aprovados', (select count(*) from public.referrals where status in ('contrato_aprovado','instalacao_agendada','instalado') and created_at >= v_inicio and created_at < v_fim),
    'instalados', (select count(*) from public.referrals where status in ('instalado','instalacao_realizada') and created_at >= v_inicio and created_at < v_fim),
    'recompensas_pendentes', (select count(*) from public.rewards where status = 'pendente'),
    'recompensas_disponiveis', (select count(*) from public.rewards where status = 'disponivel'),
    'recompensas_pagas', (select count(*) from public.rewards where status = 'pago'),
    'valor_recompensas_pendentes_centavos', coalesce((select sum(valor_centavos) from public.rewards where status = 'pendente'), 0),
    'valor_recompensas_disponiveis_centavos', coalesce((select sum(valor_centavos) from public.rewards where status = 'disponivel'), 0),
    'valor_recompensas_pagas_centavos', coalesce((select sum(valor_centavos) from public.rewards where status = 'pago'), 0),
    'por_status', coalesce((
      select jsonb_object_agg(status::text, total)
      from (select status, count(*) as total from public.referrals where created_at >= v_inicio and created_at < v_fim group by status) t
    ), '{}'::jsonb),
    'por_mes', coalesce((
      select jsonb_agg(item order by (item->>'mes')::text)
      from (
        select jsonb_build_object(
          'mes', to_char(date_trunc('month', created_at), 'YYYY-MM'),
          'total', count(*),
          'instalados', count(*) filter (where status in ('instalado','instalacao_realizada'))
        ) as item
        from public.referrals
        where created_at >= v_inicio and created_at < v_fim
        group by date_trunc('month', created_at)
        order by date_trunc('month', created_at)
      ) t
    ), '[]'::jsonb),
    'top_indicadores', coalesce((
      select jsonb_agg(item order by (item->>'total')::int desc)
      from (
        select jsonb_build_object(
          'id', r.indicator_id,
          'nome', p.nome_completo,
          'total', count(*),
          'instalados', count(*) filter (where r.status in ('instalado','instalacao_realizada'))
        ) as item
        from public.referrals r
        join public.profiles p on p.id = r.indicator_id
        where r.created_at >= v_inicio and r.created_at < v_fim
        group by r.indicator_id, p.nome_completo
        order by count(*) desc
        limit 5
      ) t
    ), '[]'::jsonb)
  )
  into v_resultado;

  return v_resultado;
end;
$$;

revoke execute on function public.get_admin_stats(date, date) from public;
grant execute on function public.get_admin_stats(date, date) to authenticated;