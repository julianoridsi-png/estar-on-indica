-- 0016_admin_alterar_permissao_status.sql
-- RPCs auditadas para alterar papel (tipo_usuario) e status de usuários.
-- Corrige a falha de alteração de permissão no frontend (grant de coluna ausente).
-- Toda mutação passa por função security definer, validando admin no servidor.

create or replace function public.admin_alterar_permissao_usuario(
  p_user_id uuid,
  p_novo_papel text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_target_role text;
begin
  if v_actor is null then
    raise exception 'Não autenticado';
  end if;

  if not private.is_admin() then
    raise exception 'Acesso negado: apenas administradores podem alterar permissões';
  end if;

  if p_user_id is null then
    raise exception 'Usuário inválido';
  end if;

  if p_user_id = v_actor then
    raise exception 'Um administrador não pode alterar a própria permissão';
  end if;

  if p_novo_papel not in ('indicador', 'comercial', 'admin') then
    raise exception 'Papel inválido: %', p_novo_papel;
  end if;

  select tipo_usuario::text into v_target_role
  from public.profiles
  where id = p_user_id;

  if v_target_role is null then
    raise exception 'Usuário não encontrado';
  end if;

  -- impedir promoção para papel superior sem autorização explícita
  -- (admin já é o maior nível; comercial não pode virar admin por esta rota)
  select tipo_usuario::text into v_role
  from public.profiles
  where id = v_actor;

  if v_role = 'comercial' and p_novo_papel = 'admin' then
    raise exception 'Sem autorização para promover a administrador';
  end if;

  update public.profiles
  set tipo_usuario = p_novo_papel::public.tipo_usuario
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'novo_papel', p_novo_papel);
end;
$$;

create or replace function public.admin_alterar_status_usuario(
  p_user_id uuid,
  p_novo_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if v_actor is null then
    raise exception 'Não autenticado';
  end if;

  if not private.is_admin() then
    raise exception 'Acesso negado: apenas administradores podem alterar status';
  end if;

  if p_user_id is null then
    raise exception 'Usuário inválido';
  end if;

  if p_user_id = v_actor then
    raise exception 'Um administrador não pode alterar o próprio status';
  end if;

  if p_novo_status not in ('ativo', 'inativo') then
    raise exception 'Status inválido: %', p_novo_status;
  end if;

  select tipo_usuario::text into v_role
  from public.profiles
  where id = v_actor;

  -- comercial não pode inativar administradores
  if v_role = 'comercial' then
    if exists (
      select 1 from public.profiles
      where id = p_user_id and tipo_usuario = 'admin'
    ) then
      raise exception 'Sem autorização para alterar status de administrador';
    end if;
  end if;

  update public.profiles
  set status = p_novo_status::public.status_usuario
  where id = p_user_id;

  return jsonb_build_object('ok', true, 'user_id', p_user_id, 'novo_status', p_novo_status);
end;
$$;

grant execute on function public.admin_alterar_permissao_usuario(uuid, text) to authenticated;
grant execute on function public.admin_alterar_status_usuario(uuid, text) to authenticated;

comment on function public.admin_alterar_permissao_usuario(uuid, text) is
  'Altera o papel (tipo_usuario) de um usuário. Apenas administradores/comercial autorizados. Auditado por trigger.';
comment on function public.admin_alterar_status_usuario(uuid, text) is
  'Altera o status (ativo/inativo) de um usuário. Apenas administradores/comercial autorizados. Auditado por trigger.';
