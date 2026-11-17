-- ============================================================================
-- ESTAR ON INDICA — 0007
-- Painel do gestor: indicadores, indicações, recompensas e dashboard.
-- Execute depois da 0006.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Rótulos de status para notificações
-- ----------------------------------------------------------------------------
create or replace function private.status_indicacao_label(p_status public.status_indicacao)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'indicacao_recebida' then 'Indicação recebida'
    when 'em_analise' then 'Em análise'
    when 'nao_atendemos_regiao' then 'Não atendemos a região'
    when 'atendemos_regiao' then 'Atendemos a região'
    when 'aguardando_contato' then 'Aguardando contato'
    when 'em_negociacao' then 'Em negociação'
    when 'contrato_aprovado' then 'Contrato aprovado'
    when 'instalacao_agendada' then 'Instalação agendada'
    when 'instalado' then 'Instalado'
    when 'cancelado' then 'Cancelado'
    when 'reprovado' then 'Reprovado'
    else p_status::text
  end;
$$;

-- ----------------------------------------------------------------------------
-- Estatísticas ampliadas do dashboard.
-- Mantém os campos anteriores e acrescenta série mensal, top indicadores
-- e valores financeiros (somente para admin).
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
  v_por_mes jsonb;
  v_top_indicadores jsonb;
  v_valor_pendente bigint := 0;
  v_valor_pago bigint := 0;
  v_recompensas_disponiveis bigint := 0;
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'mes', to_char(m.mes, 'YYYY-MM'),
        'total', coalesce(c.total, 0),
        'instalados', coalesce(i.total, 0)
      )
      order by m.mes
    ),
    '[]'::jsonb
  )
  into v_por_mes
  from generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) as m(mes)
  left join (
    select date_trunc('month', r.created_at) as mes, count(*)::bigint as total
    from public.referrals r
    group by 1
  ) c on c.mes = m.mes
  left join (
    select date_trunc('month', r.installed_at) as mes, count(*)::bigint as total
    from public.referrals r
    where r.installed_at is not null
    group by 1
  ) i on i.mes = m.mes;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'nome', t.nome,
        'total', t.total,
        'instalados', t.instalados
      )
      order by t.total desc, t.nome
    ),
    '[]'::jsonb
  )
  into v_top_indicadores
  from (
    select
      p.id,
      p.nome_completo as nome,
      count(r.id)::bigint as total,
      count(r.id) filter (where r.status = 'instalado')::bigint as instalados
    from public.profiles p
    left join public.referrals r on r.indicator_id = p.id
    where p.tipo_usuario = 'indicador'
    group by p.id, p.nome_completo
    order by count(r.id) desc, p.nome_completo
    limit 5
  ) t;

  if v_is_admin then
    select
      coalesce(sum(w.valor_centavos) filter (
        where w.status in ('pendente', 'disponivel')
      ), 0),
      coalesce(sum(w.valor_centavos) filter (where w.status = 'pago'), 0),
      count(*) filter (where w.status = 'disponivel')
    into v_valor_pendente, v_valor_pago, v_recompensas_disponiveis
    from public.rewards w;
  end if;

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
    'recompensas_disponiveis', v_recompensas_disponiveis,
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
    'valor_recompensas_pendentes_centavos', v_valor_pendente,
    'valor_recompensas_pagas_centavos', v_valor_pago,
    'por_status', v_por_status,
    'por_mes', v_por_mes,
    'top_indicadores', v_top_indicadores
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Listagem de indicadores para o gestor
-- ----------------------------------------------------------------------------
create or replace function public.admin_listar_indicadores()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_is_admin boolean;
  v_resultado jsonb;
begin
  if v_role is null or v_role not in ('admin', 'comercial') then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: esta listagem é restrita à equipe Estar On.';
  end if;

  v_is_admin := v_role = 'admin';

  select coalesce(jsonb_agg(item order by item->>'nome_completo'), '[]'::jsonb)
  into v_resultado
  from (
    select jsonb_build_object(
      'id', p.id,
      'nome_completo', p.nome_completo,
      'email', p.email,
      'cidade', p.cidade,
      'estado', p.estado,
      'status', p.status::text,
      'created_at', p.created_at,
      'total_indicacoes', (
        select count(*) from public.referrals r where r.indicator_id = p.id
      ),
      'instaladas', (
        select count(*) from public.referrals r
        where r.indicator_id = p.id and r.status = 'instalado'
      ),
      'recompensas_pendentes', (
        case when v_is_admin then (
          select count(*) from public.rewards w
          where w.indicator_id = p.id and w.status in ('pendente', 'disponivel')
        ) else 0 end
      ),
      'recompensas_pagas', (
        case when v_is_admin then (
          select count(*) from public.rewards w
          where w.indicator_id = p.id and w.status = 'pago'
        ) else 0 end
      ),
      'pix_tipo', case when v_is_admin then pa.tipo::text else null end,
      'pix_mascarada', case when v_is_admin then pa.chave_mascarada else null end,
      'pix_configurado', case when v_is_admin then (pa.profile_id is not null) else null end,
      'pix_atualizado_em', case when v_is_admin then pa.updated_at else null end
    ) as item
    from public.profiles p
    left join public.payout_accounts pa on pa.profile_id = p.id
    where p.tipo_usuario = 'indicador'
    order by p.nome_completo
    limit 500
  ) t;

  return v_resultado;
end;
$$;

-- ----------------------------------------------------------------------------
-- Revelação auditada da chave PIX completa (somente admin)
-- ----------------------------------------------------------------------------
create or replace function public.admin_revelar_chave_pix(p_profile_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
  v_tipo public.tipo_chave_pix;
  v_cifra bytea;
  v_nome text;
  v_email text;
  v_chave text;
begin
  if not v_admin then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: somente administradores podem consultar a chave PIX.';
  end if;

  select pa.tipo, pa.chave_criptografada, p.nome_completo, p.email
  into v_tipo, v_cifra, v_nome, v_email
  from public.payout_accounts pa
  join public.profiles p on p.id = pa.profile_id
  where pa.profile_id = p_profile_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'PIX_NAO_CADASTRADO: o indicador ainda não cadastrou uma chave PIX.';
  end if;

  v_chave := private.texto_decifrar(v_cifra);

  insert into public.audit_logs (
    actor_id,
    actor_email,
    acao,
    tabela,
    registro_id,
    dados_novos
  )
  values (
    auth.uid(),
    (select p.email from public.profiles p where p.id = auth.uid()),
    'REVELAR_PIX',
    'payout_accounts',
    p_profile_id::text,
    jsonb_build_object(
      'tipo', v_tipo,
      'titular', v_nome,
      'motivo', 'consulta administrativa para pagamento'
    )
  );

  return jsonb_build_object(
    'tipo', v_tipo,
    'chave', v_chave,
    'titular', v_nome,
    'email', v_email
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Atualização de status de uma indicação (admin e comercial)
-- ----------------------------------------------------------------------------
create or replace function public.admin_atualizar_status_indicacao(
  p_referral_id uuid,
  p_status text,
  p_observacao text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_staff boolean := private.is_staff();
  v_status_atual public.status_indicacao;
  v_status_novo public.status_indicacao;
  v_indicator_id uuid;
  v_indicado_nome text;
  v_observacao text := nullif(btrim(coalesce(p_observacao, '')), '');
begin
  if not v_staff then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: apenas a equipe Estar On pode alterar o status.';
  end if;

  if not exists (
    select 1
    from unnest(enum_range(null::public.status_indicacao)) as s(status)
    where s.status::text = p_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'STATUS_INVALIDO: selecione um status válido.';
  end if;

  v_status_novo := p_status::public.status_indicacao;

  select r.status, r.indicator_id, r.indicado_nome
  into v_status_atual, v_indicator_id, v_indicado_nome
  from public.referrals r
  where r.id = p_referral_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'INDICACAO_NAO_ENCONTRADA: a indicação informada não existe.';
  end if;

  if v_status_atual = v_status_novo then
    return jsonb_build_object(
      'ok', true,
      'alterado', false,
      'status', v_status_atual,
      'label', private.status_indicacao_label(v_status_atual)
    );
  end if;

  perform set_config('app.motivo_status', coalesce(v_observacao, ''), true);

  update public.referrals
  set
    status = v_status_novo,
    updated_by = auth.uid(),
    installed_at = case
      when v_status_novo = 'instalado' then coalesce(installed_at, now())
      else installed_at
    end
  where id = p_referral_id;

  insert into public.notifications (
    user_id,
    tipo,
    titulo,
    mensagem,
    link
  )
  values (
    v_indicator_id,
    'status',
    'Atualização na sua indicação',
    format(
      'A indicação de %s agora está em: %s.',
      v_indicado_nome,
      private.status_indicacao_label(v_status_novo)
    ),
    '/indicacoes'
  );

  return jsonb_build_object(
    'ok', true,
    'alterado', true,
    'status', v_status_novo,
    'label', private.status_indicacao_label(v_status_novo)
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Recompensas: listagem e atualização (somente admin)
-- ----------------------------------------------------------------------------
create or replace function public.admin_listar_recompensas()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
  v_resultado jsonb;
begin
  if not v_admin then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: dados de recompensas são restritos ao administrador.';
  end if;

  select coalesce(jsonb_agg(item order by item->>'created_at' desc), '[]'::jsonb)
  into v_resultado
  from (
    select jsonb_build_object(
      'id', w.id,
      'referral_id', w.referral_id,
      'indicator_id', w.indicator_id,
      'indicado_nome', r.indicado_nome,
      'indicator_nome', p.nome_completo,
      'indicator_email', p.email,
      'descricao', w.descricao,
      'valor_centavos', w.valor_centavos,
      'status', w.status::text,
      'liberado_em', w.liberado_em,
      'pago_em', w.pago_em,
      'created_at', w.created_at,
      'pix_tipo', pa.tipo::text,
      'pix_mascarada', pa.chave_mascarada,
      'pix_disponivel', (pa.profile_id is not null)
    ) as item
    from public.rewards w
    join public.referrals r on r.id = w.referral_id
    join public.profiles p on p.id = w.indicator_id
    left join public.payout_accounts pa on pa.profile_id = w.indicator_id
    order by w.created_at desc
    limit 500
  ) t;

  return v_resultado;
end;
$$;

create or replace function public.admin_atualizar_status_recompensa(
  p_reward_id uuid,
  p_status text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
  v_status_atual public.status_recompensa;
  v_status_novo public.status_recompensa;
  v_indicator_id uuid;
  v_valor integer;
  v_pix_existe boolean;
begin
  if not v_admin then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: somente administradores podem alterar recompensas.';
  end if;

  if not exists (
    select 1
    from unnest(enum_range(null::public.status_recompensa)) as s(status)
    where s.status::text = p_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'STATUS_INVALIDO: status de recompensa inválido.';
  end if;

  v_status_novo := p_status::public.status_recompensa;

  select w.status, w.indicator_id, w.valor_centavos
  into v_status_atual, v_indicator_id, v_valor
  from public.rewards w
  where w.id = p_reward_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'RECOMPENSA_NAO_ENCONTRADA: a recompensa informada não existe.';
  end if;

  if v_status_atual = v_status_novo then
    return jsonb_build_object(
      'ok', true,
      'alterado', false,
      'status', v_status_atual
    );
  end if;

  if not (
    (v_status_atual = 'pendente' and v_status_novo in ('disponivel', 'cancelado'))
    or (v_status_atual = 'disponivel' and v_status_novo in ('pago', 'cancelado'))
  ) then
    raise exception using
      errcode = '22023',
      message = 'TRANSICAO_INVALIDA: esta mudança de status não é permitida.';
  end if;

  if v_status_novo = 'pago' then
    select exists (
      select 1 from public.payout_accounts pa where pa.profile_id = v_indicator_id
    ) into v_pix_existe;

    if not v_pix_existe then
      raise exception using
        errcode = 'P0002',
        message = 'PIX_NAO_CADASTRADO: o indicador precisa cadastrar uma chave PIX antes do pagamento.';
    end if;
  end if;

  update public.rewards
  set
    status = v_status_novo,
    liberado_em = case
      when v_status_novo in ('disponivel', 'pago') then coalesce(liberado_em, now())
      else liberado_em
    end,
    pago_em = case
      when v_status_novo = 'pago' then coalesce(pago_em, now())
      else pago_em
    end,
    pago_por = case
      when v_status_novo = 'pago' then auth.uid()
      else pago_por
    end
  where id = p_reward_id;

  insert into public.notifications (
    user_id,
    tipo,
    titulo,
    mensagem,
    link
  )
  values (
    v_indicator_id,
    'recompensa',
    case
      when v_status_novo = 'disponivel' then 'Recompensa disponível'
      when v_status_novo = 'pago' then 'Recompensa paga'
      when v_status_novo = 'cancelado' then 'Recompensa cancelada'
      else 'Recompensa atualizada'
    end,
    case
      when v_status_novo = 'disponivel' then
        'Sua recompensa foi liberada e está disponível para pagamento.'
      when v_status_novo = 'pago' then
        'O pagamento da sua recompensa foi registrado pela equipe Estar On.'
      when v_status_novo = 'cancelado' then
        'Sua recompensa foi cancelada. Fale com a equipe para mais informações.'
      else
        'O status da sua recompensa foi atualizado.'
    end,
    '/recebimentos'
  );

  return jsonb_build_object(
    'ok', true,
    'alterado', true,
    'status', v_status_novo,
    'valor_centavos', v_valor
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Configuração do valor padrão da recompensa
-- ----------------------------------------------------------------------------
create or replace function public.admin_atualizar_config_recompensa(
  p_valor_centavos integer,
  p_prazo_dias integer
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: somente administradores podem alterar a configuração.';
  end if;

  if p_valor_centavos is null or p_valor_centavos < 0
    or p_valor_centavos > 100000000 then
    raise exception using
      errcode = '22023',
      message = 'VALOR_INVALIDO: informe um valor entre R$ 0,00 e R$ 1.000.000,00.';
  end if;

  if p_prazo_dias is null or p_prazo_dias < 0 or p_prazo_dias > 365 then
    raise exception using
      errcode = '22023',
      message = 'PRAZO_INVALIDO: informe um prazo entre 0 e 365 dias.';
  end if;

  update public.settings
  set
    recompensa_valor_centavos = p_valor_centavos,
    prazo_pagamento_dias = p_prazo_dias,
    updated_by = auth.uid()
  where id = 1;

  return jsonb_build_object(
    'ok', true,
    'recompensa_valor_centavos', p_valor_centavos,
    'prazo_pagamento_dias', p_prazo_dias
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Geração retroativa de recompensas para indicações já instaladas
-- ----------------------------------------------------------------------------
create or replace function public.admin_gerar_recompensas_pendentes()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
  v_valor integer;
  v_count integer := 0;
  v_rec record;
begin
  if not v_admin then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: somente administradores podem gerar recompensas.';
  end if;

  select s.recompensa_valor_centavos
  into v_valor
  from public.settings s
  where s.id = 1;

  if coalesce(v_valor, 0) <= 0 then
    raise exception using
      errcode = '22023',
      message = 'RECOMPENSA_NAO_CONFIGURADA: defina o valor padrão antes de gerar recompensas.';
  end if;

  for v_rec in
    select r.id, r.indicator_id
    from public.referrals r
    where r.status = 'instalado'
      and not exists (
        select 1
        from public.rewards w
        where w.referral_id = r.id
          and w.status <> 'cancelado'
      )
    order by r.created_at
  loop
    insert into public.rewards (
      referral_id,
      indicator_id,
      tipo,
      descricao,
      valor_centavos,
      status,
      criado_por
    )
    values (
      v_rec.id,
      v_rec.indicator_id,
      'financeiro',
      'Recompensa por indicação instalada',
      v_valor,
      'pendente',
      auth.uid()
    );

    insert into public.notifications (
      user_id,
      tipo,
      titulo,
      mensagem,
      link
    )
    values (
      v_rec.indicator_id,
      'recompensa',
      'Nova recompensa registrada',
      'Uma nova recompensa foi registrada na sua conta. Acompanhe em Recebimentos.',
      '/recebimentos'
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'criadas', v_count);
end;
$$;

-- ----------------------------------------------------------------------------
-- Recompensa automática quando uma indicação é marcada como instalada.
-- Só cria quando o valor padrão é maior que zero.
-- ----------------------------------------------------------------------------
create or replace function private.criar_recompensa_instalacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_valor integer;
begin
  if new.status = 'instalado'
    and (tg_op = 'INSERT' or old.status is distinct from 'instalado') then
    select s.recompensa_valor_centavos
    into v_valor
    from public.settings s
    where s.id = 1;

    if coalesce(v_valor, 0) > 0 and not exists (
      select 1
      from public.rewards w
      where w.referral_id = new.id
        and w.status <> 'cancelado'
    ) then
      insert into public.rewards (
        referral_id,
        indicator_id,
        tipo,
        descricao,
        valor_centavos,
        status,
        criado_por
      )
      values (
        new.id,
        new.indicator_id,
        'financeiro',
        'Recompensa por indicação instalada',
        v_valor,
        'pendente',
        auth.uid()
      );

      insert into public.notifications (
        user_id,
        tipo,
        titulo,
        mensagem,
        link
      )
      values (
        new.indicator_id,
        'recompensa',
        'Nova recompensa registrada',
        'Sua indicação foi instalada e uma recompensa foi registrada na sua conta.',
        '/recebimentos'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists referrals_reward_installed on public.referrals;
create trigger referrals_reward_installed
  after insert or update of status on public.referrals
  for each row execute function private.criar_recompensa_instalacao();

-- Garante apenas uma recompensa ativa por indicação.
create unique index if not exists rewards_referral_unique_idx
  on public.rewards (referral_id)
  where status <> 'cancelado';

-- ----------------------------------------------------------------------------
-- Privilégios
-- ----------------------------------------------------------------------------
revoke execute on function public.get_admin_stats() from public;
grant execute on function public.get_admin_stats() to authenticated;

revoke execute on function public.admin_listar_indicadores() from public;
grant execute on function public.admin_listar_indicadores() to authenticated;

revoke execute on function public.admin_revelar_chave_pix(uuid) from public;
grant execute on function public.admin_revelar_chave_pix(uuid) to authenticated;

revoke execute on function public.admin_atualizar_status_indicacao(uuid, text, text) from public;
grant execute on function public.admin_atualizar_status_indicacao(uuid, text, text) to authenticated;

revoke execute on function public.admin_listar_recompensas() from public;
grant execute on function public.admin_listar_recompensas() to authenticated;

revoke execute on function public.admin_atualizar_status_recompensa(uuid, text) from public;
grant execute on function public.admin_atualizar_status_recompensa(uuid, text) to authenticated;

revoke execute on function public.admin_atualizar_config_recompensa(integer, integer) from public;
grant execute on function public.admin_atualizar_config_recompensa(integer, integer) to authenticated;

revoke execute on function public.admin_gerar_recompensas_pendentes() from public;
grant execute on function public.admin_gerar_recompensas_pendentes() to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.tipo_usuario_atual() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;
