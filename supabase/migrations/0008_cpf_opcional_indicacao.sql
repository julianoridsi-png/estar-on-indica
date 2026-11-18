-- ============================================================================
-- 0008_cpf_opcional_indicacao.sql
-- Torna o CPF da pessoa indicada opcional no cadastro de indicação.
-- ============================================================================

create or replace function public.criar_indicacao(
  p_indicado_nome text,
  p_indicado_cpf text,
  p_indicado_email text,
  p_indicado_telefone text,
  p_cep text,
  p_endereco text,
  p_numero text,
  p_complemento text,
  p_bairro text,
  p_cidade text,
  p_estado text,
  p_observacoes text,
  p_consentimento boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_nome text := btrim(coalesce(p_indicado_nome, ''));
  v_cpf text := private.cpf_normalizar(p_indicado_cpf);
  v_tem_cpf boolean := false;
  v_hash bytea;
  v_email text := lower(btrim(coalesce(p_indicado_email, '')));
  v_telefone text := regexp_replace(coalesce(p_indicado_telefone, ''), '[^0-9]', '', 'g');
  v_cep text := regexp_replace(coalesce(p_cep, ''), '[^0-9]', '', 'g');
  v_endereco text := btrim(coalesce(p_endereco, ''));
  v_numero text := btrim(coalesce(p_numero, ''));
  v_complemento text := nullif(btrim(coalesce(p_complemento, '')), '');
  v_bairro text := btrim(coalesce(p_bairro, ''));
  v_cidade text := btrim(coalesce(p_cidade, ''));
  v_estado text := upper(btrim(coalesce(p_estado, '')));
  v_observacoes text := nullif(btrim(coalesce(p_observacoes, '')), '');
  v_ddd integer;
  v_id uuid;
begin
  if v_uid is null or v_role is null then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: faça login para cadastrar uma indicação.';
  end if;

  if v_role <> 'indicador' then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: apenas indicadores podem cadastrar novas indicações.';
  end if;

  if char_length(v_nome) < 5 or char_length(v_nome) > 160 then
    raise exception using
      errcode = '22023',
      message = 'NOME_INVALIDO: informe o nome completo da pessoa indicada.';
  end if;

  -- CPF opcional: valida apenas se informado
  if v_cpf <> '' then
    if not private.cpf_valido(v_cpf) then
      raise exception using
        errcode = '22023',
        message = 'CPF_INVALIDO: o CPF da pessoa indicada não é válido.';
    end if;
    v_tem_cpf := true;
    v_hash := private.cpf_hash(v_cpf);

    if exists (
      select 1 from public.profile_sensitive ps where ps.cpf_hash = v_hash
    ) or exists (
      select 1 from public.referral_sensitive rs where rs.cpf_hash = v_hash
    ) then
      raise exception using
        errcode = '23505',
        message = 'CPF_JA_CADASTRADO: este CPF já está cadastrado na plataforma.';
    end if;
  end if;

  if v_email !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
    or char_length(v_email) > 254 then
    raise exception using
      errcode = '22023',
      message = 'EMAIL_INVALIDO: informe um e-mail válido para a pessoa indicada.';
  end if;

  if char_length(v_telefone) not in (10, 11) then
    raise exception using
      errcode = '22023',
      message = 'TELEFONE_INVALIDO: informe DDD + telefone da pessoa indicada.';
  end if;

  v_ddd := substr(v_telefone, 1, 2)::integer;
  if v_ddd < 11 or v_ddd > 99 then
    raise exception using
      errcode = '22023',
      message = 'TELEFONE_INVALIDO: o DDD informado não é válido.';
  end if;

  if char_length(v_cep) <> 8 then
    raise exception using
      errcode = '22023',
      message = 'CEP_INVALIDO: informe um CEP com 8 dígitos.';
  end if;

  if char_length(v_endereco) < 5 or char_length(v_bairro) < 2
    or char_length(v_cidade) < 2 or char_length(v_numero) < 1 then
    raise exception using
      errcode = '22023',
      message = 'ENDERECO_INVALIDO: preencha o endereço completo da pessoa indicada.';
  end if;

  if not (v_estado = any (array[
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ]::text[])) then
    raise exception using
      errcode = '22023',
      message = 'UF_INVALIDA: selecione um estado brasileiro.';
  end if;

  if v_observacoes is not null and char_length(v_observacoes) > 1000 then
    raise exception using
      errcode = '22023',
      message = 'OBSERVACOES_LONGAS: use no máximo 1000 caracteres.';
  end if;

  if not coalesce(p_consentimento, false) then
    raise exception using
      errcode = '22023',
      message = 'CONSENTIMENTO_OBRIGATORIO: confirme a autorização da pessoa indicada.';
  end if;

  insert into public.referrals (
    indicator_id,
    indicado_nome,
    indicado_cpf_final,
    indicado_email,
    indicado_telefone,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    observacoes,
    consentimento_lgpd_em,
    created_by
  )
  values (
    v_uid,
    v_nome,
    case when v_tem_cpf then right(v_cpf, 2) else null end,
    v_email,
    v_telefone,
    v_cep,
    v_endereco,
    v_numero,
    v_complemento,
    v_bairro,
    v_cidade,
    v_estado,
    v_observacoes,
    now(),
    v_uid
  )
  returning id into v_id;

  -- Armazena CPF criptografado apenas se informado
  if v_tem_cpf then
    insert into public.referral_sensitive (
      referral_id,
      cpf_encrypted,
      cpf_hash
    )
    values (
      v_id,
      private.cpf_criptografar(v_cpf),
      v_hash
    );
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_email,
    acao,
    tabela,
    registro_id,
    dados_novos
  )
  values (
    v_uid,
    (select p.email from public.profiles p where p.id = v_uid),
    'CRIAR_INDICACAO',
    'referrals',
    v_id::text,
    jsonb_build_object(
      'indicado_nome', v_nome,
      'indicado_cpf_final', case when v_tem_cpf then right(v_cpf, 2) else null end,
      'cidade', v_cidade,
      'estado', v_estado,
      'consentimento_lgpd', true
    )
  );

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'message', 'Indicação cadastrada com sucesso.'
  );
end;
$$;

revoke execute on function public.criar_indicacao(text, text, text, text, text, text, text, text, text, text, text, text, boolean) from public;
grant execute on function public.criar_indicacao(text, text, text, text, text, text, text, text, text, text, text, text, boolean) to authenticated;