-- ============================================================================
-- ESTAR ON INDICA — 0001
-- Extensões, schema privado, enums e funções de proteção do CPF.
-- Execute este arquivo antes dos demais, no SQL Editor do Supabase.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, service_role;

-- ----------------------------------------------------------------------------
-- Chave de criptografia do CPF.
-- A chave é gerada dentro do Vault. Nenhum segredo fica no repositório.
-- Se a chave já existir, nada é alterado.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'estar_on_cpf_key'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'estar_on_cpf_key',
      'Chave simétrica usada para criptografar CPFs na plataforma Estar On Indica.'
    );
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.tipo_usuario as enum ('indicador', 'comercial', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.status_usuario as enum ('ativo', 'inativo');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.status_indicacao as enum (
    'indicacao_recebida',
    'em_analise',
    'nao_atendemos_regiao',
    'atendemos_regiao',
    'aguardando_contato',
    'em_negociacao',
    'contrato_aprovado',
    'instalacao_agendada',
    'instalado',
    'cancelado',
    'reprovado'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.status_recompensa as enum (
    'pendente',
    'disponivel',
    'pago',
    'cancelado'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_recompensa as enum (
    'financeiro',
    'servico',
    'produto',
    'outro'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.tipo_consentimento as enum (
    'termos',
    'privacidade',
    'comunicacoes'
  );
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- Normalização e validação de CPF
-- ----------------------------------------------------------------------------
create or replace function private.cpf_normalizar(p_cpf text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
$$;

create or replace function private.cpf_valido(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_cpf text := private.cpf_normalizar(p_cpf);
  v_soma integer;
  v_digito integer;
  v_indice integer;
begin
  if char_length(v_cpf) <> 11 then
    return false;
  end if;

  if v_cpf = repeat(substr(v_cpf, 1, 1), 11) then
    return false;
  end if;

  v_soma := 0;
  for v_indice in 1..9 loop
    v_soma := v_soma + (substr(v_cpf, v_indice, 1)::integer * (11 - v_indice));
  end loop;

  v_digito := (v_soma * 10) % 11;
  if v_digito = 10 then
    v_digito := 0;
  end if;

  if v_digito <> substr(v_cpf, 10, 1)::integer then
    return false;
  end if;

  v_soma := 0;
  for v_indice in 1..10 loop
    v_soma := v_soma + (substr(v_cpf, v_indice, 1)::integer * (12 - v_indice));
  end loop;

  v_digito := (v_soma * 10) % 11;
  if v_digito = 10 then
    v_digito := 0;
  end if;

  return v_digito = substr(v_cpf, 11, 1)::integer;
end;
$$;

-- ----------------------------------------------------------------------------
-- Chave, hash e criptografia
-- Falham de forma fechada (com exceção) se a chave não existir no Vault.
-- ----------------------------------------------------------------------------
create or replace function private.cpf_chave()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_chave text;
begin
  select ds.decrypted_secret
  into v_chave
  from vault.decrypted_secrets ds
  where ds.name = 'estar_on_cpf_key'
  limit 1;

  if v_chave is null or char_length(v_chave) < 16 then
    raise exception using
      errcode = 'P0001',
      message = 'CPF_ENCRYPTION_KEY_MISSING: configure o segredo estar_on_cpf_key no Vault.';
  end if;

  return v_chave;
end;
$$;

create or replace function private.cpf_hash(p_cpf text)
returns bytea
language sql
stable
security definer
set search_path = ''
as $$
  select extensions.hmac(
    convert_to(private.cpf_normalizar(p_cpf), 'UTF8'),
    convert_to(private.cpf_chave(), 'UTF8'),
    'sha256'
  );
$$;

create or replace function private.cpf_criptografar(p_cpf text)
returns bytea
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_cpf text := private.cpf_normalizar(p_cpf);
begin
  if not private.cpf_valido(v_cpf) then
    raise exception using
      errcode = '23514',
      message = 'CPF_INVALIDO: o CPF informado não é válido.';
  end if;

  return extensions.pgp_sym_encrypt(
    v_cpf,
    private.cpf_chave(),
    'cipher-algo=aes256'
  );
end;
$$;

-- Usada apenas por rotinas internas auditadas. Nunca é exposta via API.
create or replace function private.cpf_decifrar(p_cifra bytea)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return extensions.pgp_sym_decrypt(p_cifra, private.cpf_chave());
end;
$$;

-- ----------------------------------------------------------------------------
-- Utilitário de updated_at
-- ----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Privilégios mínimos por padrão.
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.cpf_normalizar(text) to postgres, service_role;
