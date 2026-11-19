-- ============================================================================
-- 0012_admin_usuarios.sql
-- RPC para listar todos os usuários (admin).
-- ============================================================================
create or replace function public.admin_listar_usuarios()
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
      message = 'ACESSO_NEGADO: somente administradores podem listar usuários.';
  end if;

  select coalesce(jsonb_agg(item order by item->>'created_at' desc), '[]'::jsonb)
  into v_resultado
  from (
    select jsonb_build_object(
      'id', p.id,
      'nome_completo', p.nome_completo,
      'email', p.email,
      'tipo_usuario', p.tipo_usuario::text,
      'status', p.status::text,
      'cidade', p.cidade,
      'estado', p.estado,
      'created_at', p.created_at,
      'total_indicacoes', coalesce((select count(*) from public.referrals r where r.indicator_id = p.id), 0)
    ) as item
    from public.profiles p
    order by p.created_at desc
    limit 500
  ) t;

  return v_resultado;
end;
$$;

revoke execute on function public.admin_listar_usuarios() from public;
grant execute on function public.admin_listar_usuarios() to authenticated;