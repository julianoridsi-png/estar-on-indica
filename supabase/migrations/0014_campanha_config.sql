-- ============================================================================
-- 0014_campanha_config.sql
-- Atualiza a configuração de campanha para incluir datas e status ativo.
-- ============================================================================
create or replace function public.admin_atualizar_config_recompensa(
  p_valor_centavos integer,
  p_prazo_dias integer,
  p_data_inicio date default null,
  p_data_fim date default null,
  p_ativa boolean default true
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if not v_admin then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: somente administradores podem alterar configurações.';
  end if;

  if p_valor_centavos < 0 or p_valor_centavos > 100000000 then
    raise exception using
      errcode = '22023',
      message = 'VALOR_INVALIDO: informe um valor entre R$ 0,00 e R$ 1.000.000,00.';
  end if;

  if p_prazo_dias < 0 or p_prazo_dias > 365 then
    raise exception using
      errcode = '22023',
      message = 'PRAZO_INVALIDO: informe um prazo entre 0 e 365 dias.';
  end if;

  if p_data_inicio is not null and p_data_fim is not null and p_data_fim < p_data_inicio then
    raise exception using
      errcode = '22023',
      message = 'DATAS_INVALIDAS: a data final deve ser posterior à data inicial.';
  end if;

  update public.settings
  set recompensa_valor_centavos = p_valor_centavos,
      prazo_pagamento_dias = p_prazo_dias,
      campanha_data_inicio = p_data_inicio,
      campanha_data_fim = p_data_fim,
      campanha_ativa = p_ativa,
      updated_by = auth.uid(),
      updated_at = now()
  where id = 1;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.admin_atualizar_config_recompensa(integer, integer, date, date, boolean) from public;
grant execute on function public.admin_atualizar_config_recompensa(integer, integer, date, date, boolean) to authenticated;