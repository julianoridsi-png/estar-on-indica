-- ============================================================================
-- ESTAR ON INDICA — 0006
-- Chave PIX do indicador (criptografada) e criação de indicações pelo painel.
-- Execute depois da 0005.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tipo da chave PIX
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.tipo_chave_pix as enum (
    'cpf',
    'cnpj',
    'email',
    'telefone',
    'aleatoria'
  );
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- Conta de recebimento do indicador.
-- A chave completa nunca é exposta diretamente pela API: fica cifrada e só
-- pode ser lida por funções auditadas (admin) ou exibida mascarada.
-- ----------------------------------------------------------------------------
create table if not exists public.payout_accounts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  tipo public.tipo_chave_pix not null,
  chave_criptografada bytea not null,
  chave_mascarada text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payout_accounts is
  'Dados de recebimento PIX do indicador. A chave completa é cifrada com AES-256 via Vault.';
comment on column public.payout_accounts.chave_mascarada is
  'Versão mascarada exibida no painel do indicador e na listagem administrativa.';

alter table public.payout_accounts enable row level security;

revoke all on table public.payout_accounts from anon, authenticated;

drop trigger if exists payout_accounts_set_updated_at on public.payout_accounts;
create trigger payout_accounts_set_updated_at
  before update on public.payout_accounts
  for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- Criptografia genérica de textos sensíveis (mesma chave do Vault).
-- ----------------------------------------------------------------------------
create or replace function private.texto_criptografar(p_texto text)
returns bytea
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_texto text := btrim(coalesce(p_texto, ''));
begin
  if v_texto = '' then
    raise exception using
      errcode = '22023',
      message = 'TEXTO_VAZIO: não é possível criptografar um valor vazio.';
  end if;

  return extensions.pgp_sym_encrypt(
    v_texto,
    private.cpf_chave(),
    'cipher-algo=aes256'
  );
end;
$$;

create or replace function private.texto_decifrar(p_cifra bytea)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_cifra is null then
    return null;
  end if;

  return extensions.pgp_sym_decrypt(p_cifra, private.cpf_chave());
end;
$$;

-- ----------------------------------------------------------------------------
-- CNPJ (validação usada pelas chaves PIX)
-- ----------------------------------------------------------------------------
create or replace function private.cnpj_valido(p_cnpj text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_cnpj text := regexp_replace(coalesce(p_cnpj, ''), '[^0-9]', '', 'g');
  v_pesos1 integer[] := array[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  v_pesos2 integer[] := array[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  v_soma integer;
  v_digito integer;
  v_indice integer;
begin
  if char_length(v_cnpj) <> 14 then
    return false;
  end if;

  if v_cnpj = repeat(substr(v_cnpj, 1, 1), 14) then
    return false;
  end if;

  v_soma := 0;
  for v_indice in 1..12 loop
    v_soma := v_soma
      + substr(v_cnpj, v_indice, 1)::integer * v_pesos1[v_indice];
  end loop;

  v_digito := v_soma % 11;
  v_digito := case when v_digito < 2 then 0 else 11 - v_digito end;

  if v_digito <> substr(v_cnpj, 13, 1)::integer then
    return false;
  end if;

  v_soma := 0;
  for v_indice in 1..13 loop
    v_soma := v_soma
      + substr(v_cnpj, v_indice, 1)::integer * v_pesos2[v_indice];
  end loop;

  v_digito := v_soma % 11;
  v_digito := case when v_digito < 2 then 0 else 11 - v_digito end;

  return v_digito = substr(v_cnpj, 14, 1)::integer;
end;
$$;

-- ----------------------------------------------------------------------------
-- Normalização, validação e máscara da chave PIX
-- ----------------------------------------------------------------------------
create or replace function private.pix_chave_normalizada(
  p_tipo public.tipo_chave_pix,
  p_chave text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_texto text := btrim(coalesce(p_chave, ''));
  v_digitos text;
begin
  case p_tipo
    when 'cpf' then
      return private.cpf_normalizar(v_texto);
    when 'cnpj' then
      return regexp_replace(v_texto, '[^0-9]', '', 'g');
    when 'telefone' then
      v_digitos := regexp_replace(v_texto, '[^0-9]', '', 'g');
      if char_length(v_digitos) in (10, 11) then
        v_digitos := '55' || v_digitos;
      end if;
      return '+' || v_digitos;
    when 'email' then
      return lower(v_texto);
    when 'aleatoria' then
      return lower(v_texto);
    else
      return v_texto;
  end case;
end;
$$;

create or replace function private.pix_chave_valida(
  p_tipo public.tipo_chave_pix,
  p_chave text
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_chave text := private.pix_chave_normalizada(p_tipo, p_chave);
  v_digitos text;
  v_ddd integer;
  v_local text;
begin
  if v_chave is null or v_chave = '' then
    return false;
  end if;

  case p_tipo
    when 'cpf' then
      return private.cpf_valido(v_chave);
    when 'cnpj' then
      return private.cnpj_valido(v_chave);
    when 'email' then
      return char_length(v_chave) <= 254
        and v_chave ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$';
    when 'telefone' then
      v_digitos := regexp_replace(v_chave, '[^0-9]', '', 'g');

      if char_length(v_digitos) not in (12, 13) then
        return false;
      end if;

      if left(v_digitos, 2) <> '55' then
        return false;
      end if;

      v_local := substr(v_digitos, 3);
      if char_length(v_local) not in (10, 11) then
        return false;
      end if;

      v_ddd := substr(v_local, 1, 2)::integer;
      if v_ddd < 11 or v_ddd > 99 then
        return false;
      end if;

      if char_length(v_local) = 11 and substr(v_local, 3, 1) <> '9' then
        return false;
      end if;

      return true;
    when 'aleatoria' then
      return v_chave ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or v_chave ~ '^[0-9a-f]{32}$';
    else
      return false;
  end case;
end;
$$;

create or replace function private.mascarar_chave_pix(
  p_tipo public.tipo_chave_pix,
  p_chave text
)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_chave text := private.pix_chave_normalizada(p_tipo, p_chave);
  v_digitos text;
  v_arroba integer;
begin
  case p_tipo
    when 'cpf' then
      v_digitos := regexp_replace(v_chave, '[^0-9]', '', 'g');
      return '***.***.***-' || right(v_digitos, 2);
    when 'cnpj' then
      v_digitos := regexp_replace(v_chave, '[^0-9]', '', 'g');
      return '**.***.***/****-' || right(v_digitos, 2);
    when 'email' then
      v_arroba := position('@' in v_chave);
      if v_arroba > 1 then
        return left(v_chave, least(2, v_arroba - 1)) || '***' || substr(v_chave, v_arroba);
      end if;
      return '***';
    when 'telefone' then
      v_digitos := regexp_replace(v_chave, '[^0-9]', '', 'g');
      return '(**) *****-' || right(v_digitos, 4);
    when 'aleatoria' then
      return left(v_chave, 4) || '...' || right(v_chave, 4);
    else
      return '***';
  end case;
end;
$$;

-- ----------------------------------------------------------------------------
-- Salvar a própria chave PIX
-- ----------------------------------------------------------------------------
create or replace function public.salvar_chave_pix(
  p_tipo public.tipo_chave_pix,
  p_chave text
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
  v_chave text;
  v_mascara text;
  v_agora timestamptz := now();
begin
  if v_uid is null or v_role is null then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: faça login para salvar sua chave PIX.';
  end if;

  if v_role <> 'indicador' then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: a conta PIX é exclusiva do perfil de indicador.';
  end if;

  v_chave := private.pix_chave_normalizada(p_tipo, p_chave);

  if not private.pix_chave_valida(p_tipo, v_chave) then
    raise exception using
      errcode = '22023',
      message = 'PIX_INVALIDO: confira a chave informada para o tipo selecionado.';
  end if;

  v_mascara := private.mascarar_chave_pix(p_tipo, v_chave);

  insert into public.payout_accounts (
    profile_id,
    tipo,
    chave_criptografada,
    chave_mascarada,
    created_at,
    updated_at
  )
  values (
    v_uid,
    p_tipo,
    private.texto_criptografar(v_chave),
    v_mascara,
    v_agora,
    v_agora
  )
  on conflict (profile_id) do update
  set
    tipo = excluded.tipo,
    chave_criptografada = excluded.chave_criptografada,
    chave_mascarada = excluded.chave_mascarada,
    updated_at = v_agora;

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
    'SALVAR_PIX',
    'payout_accounts',
    v_uid::text,
    jsonb_build_object('tipo', p_tipo, 'chave_mascarada', v_mascara)
  );

  return jsonb_build_object(
    'tipo', p_tipo,
    'chave_mascarada', v_mascara,
    'updated_at', v_agora
  );
end;
$$;

create or replace function public.get_minha_chave_pix()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when pa.profile_id is null then null
    else jsonb_build_object(
      'tipo', pa.tipo,
      'chave_mascarada', pa.chave_mascarada,
      'created_at', pa.created_at,
      'updated_at', pa.updated_at
    )
  end
  from (select auth.uid() as uid) u
  left join public.payout_accounts pa on pa.profile_id = u.uid;
$$;

create or replace function public.remover_chave_pix()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_removida boolean := false;
begin
  if v_uid is null then
    raise exception using
      errcode = '42501',
      message = 'ACESSO_NEGADO: faça login para remover sua chave PIX.';
  end if;

  delete from public.payout_accounts pa where pa.profile_id = v_uid;
  v_removida := found;

  if v_removida then
    insert into public.audit_logs (
      actor_id,
      actor_email,
      acao,
      tabela,
      registro_id
    )
    values (
      v_uid,
      (select p.email from public.profiles p where p.id = v_uid),
      'REMOVER_PIX',
      'payout_accounts',
      v_uid::text
    );
  end if;

  return v_removida;
end;
$$;

-- ----------------------------------------------------------------------------
-- Consentimento LGPD do indicado + criação de indicação pelo painel
-- ----------------------------------------------------------------------------
alter table public.referrals
  add column if not exists consentimento_lgpd_em timestamptz;

comment on column public.referrals.consentimento_lgpd_em is
  'Data em que o indicador declarou ter autorização da pessoa indicada para compartilhar os dados.';

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

  if not private.cpf_valido(v_cpf) then
    raise exception using
      errcode = '22023',
      message = 'CPF_INVALIDO: o CPF da pessoa indicada não é válido.';
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
    right(v_cpf, 2),
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
      'indicado_cpf_final', right(v_cpf, 2),
      'cidade', v_cidade,
      'estado', v_estado,
      'consentimento_lgpd', true
    )
  );

  return jsonb_build_object(
    'id', v_id,
    'status', 'indicacao_recebida'
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Privilégios
-- ----------------------------------------------------------------------------
revoke execute on function public.salvar_chave_pix(public.tipo_chave_pix, text) from public;
grant execute on function public.salvar_chave_pix(public.tipo_chave_pix, text) to authenticated;

revoke execute on function public.get_minha_chave_pix() from public;
grant execute on function public.get_minha_chave_pix() to authenticated;

revoke execute on function public.remover_chave_pix() from public;
grant execute on function public.remover_chave_pix() to authenticated;

revoke execute on function public.criar_indicacao(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
) from public;
grant execute on function public.criar_indicacao(
  text, text, text, text, text, text, text, text, text, text, text, text, boolean
) to authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.tipo_usuario_atual() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;
