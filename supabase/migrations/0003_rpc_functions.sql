-- ============================================================================
-- ESTAR ON INDICA — 0003
-- RPCs públicas usadas pelo aplicativo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Verificação de CPF disponível (usada antes do cadastro).
-- Retorna false para CPF inválido; o aplicativo já bloqueia esse caso antes.
-- ----------------------------------------------------------------------------
create or replace function public.cpf_disponivel(p_cpf text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cpf text := private.cpf_normalizar(p_cpf);
begin
  if not private.cpf_valido(v_cpf) then
    return false;
  end if;

  return not exists (
    select 1
    from public.profile_sensitive ps
    where ps.cpf_hash = private.cpf_hash(v_cpf)
  );
end;
$$;

comment on function public.cpf_disponivel(text) is
  'Verifica se o CPF ainda não possui perfil. Não retorna o CPF nem o hash.';

-- ----------------------------------------------------------------------------
-- Estatísticas do painel do indicador.
-- security invoker: as policies de RLS limitam os dados ao próprio usuário.
-- ----------------------------------------------------------------------------
create or replace function public.get_indicator_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total_indicacoes', (
      select count(*)
      from public.referrals r
      where r.indicator_id = auth.uid()
    ),
    'em_andamento', (
      select count(*)
      from public.referrals r
      where r.indicator_id = auth.uid()
        and r.status in (
          'indicacao_recebida',
          'em_analise',
          'atendemos_regiao',
          'aguardando_contato',
          'em_negociacao',
          'contrato_aprovado',
          'instalacao_agendada'
        )
    ),
    'aprovadas', (
      select count(*)
      from public.referrals r
      where r.indicator_id = auth.uid()
        and r.status in (
          'contrato_aprovado',
          'instalacao_agendada',
          'instalado'
        )
    ),
    'instaladas', (
      select count(*)
      from public.referrals r
      where r.indicator_id = auth.uid()
        and r.status = 'instalado'
    ),
    'recompensas_pendentes', (
      select count(*)
      from public.rewards w
      where w.indicator_id = auth.uid()
        and w.status = 'pendente'
    ),
    'recompensas_disponiveis', (
      select count(*)
      from public.rewards w
      where w.indicator_id = auth.uid()
        and w.status = 'disponivel'
    )
  );
$$;

comment on function public.get_indicator_stats() is
  'Totais do painel do indicador, calculados sobre os dados visíveis via RLS.';

-- ----------------------------------------------------------------------------
-- Estatísticas administrativas.
-- security definer com verificação explícita de papel.
-- Recompensas só são contabilizadas para administradores.
-- ----------------------------------------------------------------------------
create or replace function public.get_admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_is_admin boolean := false;
  v_por_status jsonb;
begin
  if v_role is null or v_role not in ('admin', 'comercial') then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: esta visão é restrita à equipe Estar On.';
  end if;

  v_is_admin := v_role = 'admin';

  select coalesce(
    jsonb_object_agg(s.status::text, coalesce(c.total, 0)),
    '{}'::jsonb
  )
  into v_por_status
  from unnest(enum_range(null::public.status_indicacao)) as s(status)
  left join (
    select r.status, count(*)::bigint as total
    from public.referrals r
    group by r.status
  ) c on c.status = s.status;

  return jsonb_build_object(
    'total_indicadores', (
      select count(*)
      from public.profiles p
      where p.tipo_usuario = 'indicador'
    ),
    'total_indicacoes', (
      select count(*)
      from public.referrals r
    ),
    'contratos_aprovados', (
      select count(*)
      from public.referrals r
      where r.status in (
        'contrato_aprovado',
        'instalacao_agendada',
        'instalado'
      )
    ),
    'instalados', (
      select count(*)
      from public.referrals r
      where r.status = 'instalado'
    ),
    'recompensas_pendentes', (
      case
        when v_is_admin then (
          select count(*)
          from public.rewards w
          where w.status = 'pendente'
        )
        else 0
      end
    ),
    'recompensas_pagas', (
      case
        when v_is_admin then (
          select count(*)
          from public.rewards w
          where w.status = 'pago'
        )
        else 0
      end
    ),
    'por_status', v_por_status
  );
end;
$$;

comment on function public.get_admin_stats() is
  'Totais da operação para admin e comercial. Dados de recompensa somente para admin.';

-- ----------------------------------------------------------------------------
-- Privilégios das RPCs
-- ----------------------------------------------------------------------------
revoke execute on function public.cpf_disponivel(text) from public;
grant execute on function public.cpf_disponivel(text) to anon, authenticated;

revoke execute on function public.get_indicator_stats() from public;
grant execute on function public.get_indicator_stats() to authenticated;

revoke execute on function public.get_admin_stats() from public;
grant execute on function public.get_admin_stats() to authenticated;
