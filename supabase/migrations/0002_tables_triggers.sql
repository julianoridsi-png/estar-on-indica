-- ============================================================================
-- ESTAR ON INDICA — 0002
-- Tabelas, índices, trilha de auditoria e triggers.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Perfis
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null
    check (char_length(btrim(nome_completo)) between 2 and 160),
  email text not null,
  cpf_final char(2) not null
    check (cpf_final ~ '^[0-9]{2}$'),
  cep char(8)
    check (cep is null or cep ~ '^[0-9]{8}$'),
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado char(2)
    check (estado is null or estado ~ '^[A-Z]{2}$'),
  tipo_usuario public.tipo_usuario not null default 'indicador',
  status public.status_usuario not null default 'ativo',
  ultimo_acesso_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dados cadastrais não sensíveis dos usuários. O CPF completo fica em profile_sensitive.';
comment on column public.profiles.cpf_final is
  'Apenas os dois últimos dígitos do CPF, usados para exibição mascarada.';

create index if not exists profiles_email_idx
  on public.profiles (lower(email));
create index if not exists profiles_tipo_status_idx
  on public.profiles (tipo_usuario, status);

-- ----------------------------------------------------------------------------
-- Dados sensíveis do perfil (CPF criptografado + hash para unicidade)
-- ----------------------------------------------------------------------------
create table if not exists public.profile_sensitive (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  cpf_encrypted bytea not null,
  cpf_hash bytea not null unique,
  telefone text
    check (telefone is null or telefone ~ '^[0-9]{10,13}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profile_sensitive is
  'Dados sensíveis do perfil. Acesso direto pela API é bloqueado; somente funções auditadas podem ler.';
comment on column public.profile_sensitive.cpf_encrypted is
  'CPF completo cifrado com AES-256 via pgcrypto e chave mantida no Vault.';
comment on column public.profile_sensitive.cpf_hash is
  'HMAC-SHA256 do CPF normalizado, usado para impedir duplicidade sem expor o valor.';

-- ----------------------------------------------------------------------------
-- Campanhas e configurações
-- ----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 120),
  descricao text,
  regulamento_url text,
  inicio_em date,
  fim_em date,
  ativa boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_periodo_check
    check (fim_em is null or inicio_em is null or fim_em >= inicio_em)
);

create table if not exists public.settings (
  id smallint primary key default 1 check (id = 1),
  nome_empresa text not null default 'Estar On Internet',
  logo_url text,
  cor_primaria text not null default '#0b5cff'
    check (cor_primaria ~ '^#[0-9A-Fa-f]{6}$'),
  cor_secundaria text not null default '#071a3a'
    check (cor_secundaria ~ '^#[0-9A-Fa-f]{6}$'),
  whatsapp_suporte text,
  email_suporte text,
  site_url text,
  recompensa_valor_centavos integer not null default 0
    check (recompensa_valor_centavos >= 0),
  prazo_pagamento_dias integer not null default 30
    check (prazo_pagamento_dias between 0 and 365),
  termos_versao text not null default '1.0',
  privacidade_versao text not null default '1.0',
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.settings is
  'Configurações públicas da marca. Não armazene segredos nesta tabela.';

insert into public.settings (id)
values (1)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Indicações
-- ----------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.profiles (id) on delete restrict,
  indicado_nome text not null
    check (char_length(btrim(indicado_nome)) between 2 and 160),
  indicado_cpf_final char(2) not null
    check (indicado_cpf_final ~ '^[0-9]{2}$'),
  indicado_email text,
  indicado_telefone text
    check (indicado_telefone is null or indicado_telefone ~ '^[0-9]{10,13}$'),
  cep char(8)
    check (cep is null or cep ~ '^[0-9]{8}$'),
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado char(2)
    check (estado is null or estado ~ '^[A-Z]{2}$'),
  observacoes text,
  status public.status_indicacao not null default 'indicacao_recebida',
  origem text not null default 'painel',
  installed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.referrals is
  'Indicações. O CPF completo do indicado fica em referral_sensitive.';
comment on column public.referrals.indicado_cpf_final is
  'Apenas os dois últimos dígitos do CPF do indicado.';

create index if not exists referrals_indicator_idx
  on public.referrals (indicator_id, created_at desc);
create index if not exists referrals_status_idx
  on public.referrals (status);
create index if not exists referrals_created_idx
  on public.referrals (created_at desc);

create table if not exists public.referral_sensitive (
  referral_id uuid primary key references public.referrals (id) on delete cascade,
  cpf_encrypted bytea not null,
  cpf_hash bytea not null unique,
  created_at timestamptz not null default now()
);

comment on table public.referral_sensitive is
  'CPF criptografado das pessoas indicadas. Sem acesso direto pela API.';

-- ----------------------------------------------------------------------------
-- Histórico de status
-- ----------------------------------------------------------------------------
create table if not exists public.referral_history (
  id bigint generated always as identity primary key,
  referral_id uuid not null references public.referrals (id) on delete cascade,
  status_anterior public.status_indicacao,
  status_novo public.status_indicacao not null,
  observacao text,
  alterado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists referral_history_referral_idx
  on public.referral_history (referral_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Recompensas
-- ----------------------------------------------------------------------------
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals (id) on delete restrict,
  indicator_id uuid not null references public.profiles (id) on delete restrict,
  campaign_id uuid references public.campaigns (id) on delete set null,
  tipo public.tipo_recompensa not null default 'financeiro',
  descricao text not null check (char_length(btrim(descricao)) between 2 and 240),
  valor_centavos integer not null default 0 check (valor_centavos >= 0),
  status public.status_recompensa not null default 'pendente',
  liberado_em timestamptz,
  pago_em timestamptz,
  criado_por uuid references public.profiles (id) on delete set null,
  pago_por uuid references public.profiles (id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rewards_indicator_status_idx
  on public.rewards (indicator_id, status);
create index if not exists rewards_referral_idx
  on public.rewards (referral_id);

-- ----------------------------------------------------------------------------
-- Consentimentos LGPD
-- ----------------------------------------------------------------------------
create table if not exists public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo public.tipo_consentimento not null,
  versao text not null,
  aceito_em timestamptz not null default now(),
  ip inet,
  user_agent text,
  unique (user_id, tipo, versao)
);

create index if not exists consents_user_idx
  on public.consents (user_id, tipo);

-- ----------------------------------------------------------------------------
-- Trilha de auditoria
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  acao text not null,
  tabela text not null,
  registro_id text,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Trilha de auditoria imutável para operações administrativas e de status.';

create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_tabela_idx
  on public.audit_logs (tabela, created_at desc);

-- ----------------------------------------------------------------------------
-- Notificações internas
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null default 'sistema',
  titulo text not null check (char_length(btrim(titulo)) between 2 and 160),
  mensagem text not null check (char_length(btrim(mensagem)) between 2 and 1000),
  link text,
  lida boolean not null default false,
  lida_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, lida, created_at desc);

-- ----------------------------------------------------------------------------
-- Funções auxiliares de papel do usuário
-- ----------------------------------------------------------------------------
create or replace function private.tipo_usuario_atual()
returns public.tipo_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.tipo_usuario
  from public.profiles p
  where p.id = auth.uid()
    and p.status = 'ativo'
  limit 1;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.tipo_usuario_atual() = 'admin', false);
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.tipo_usuario_atual() in ('admin', 'comercial'), false);
$$;

-- ----------------------------------------------------------------------------
-- Criação automática do perfil após o cadastro no Supabase Auth
-- O papel é sempre "indicador". Nunca confie em metadata enviada pelo cliente.
-- ----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email text := lower(coalesce(new.email, ''));
  v_nome text;
  v_cpf text;
  v_telefone text;
  v_cep text;
  v_estado text;
  v_termos text;
  v_privacidade text;
begin
  v_nome := nullif(btrim(coalesce(v_meta ->> 'nome_completo', '')), '');

  if v_nome is null or char_length(v_nome) < 2 then
    v_nome := coalesce(nullif(split_part(v_email, '@', 1), ''), 'Indicador');
    if char_length(v_nome) < 2 then
      v_nome := 'Indicador';
    end if;
  end if;

  v_cpf := private.cpf_normalizar(v_meta ->> 'cpf');

  if not private.cpf_valido(v_cpf) then
    raise exception using
      errcode = '23514',
      message = 'CPF_INVALIDO: informe um CPF válido para concluir o cadastro.';
  end if;

  v_telefone := private.cpf_normalizar(v_meta ->> 'telefone');
  if char_length(v_telefone) < 10 or char_length(v_telefone) > 13 then
    v_telefone := null;
  end if;

  v_cep := private.cpf_normalizar(v_meta ->> 'cep');
  if char_length(v_cep) <> 8 then
    v_cep := null;
  end if;

  v_estado := upper(btrim(coalesce(v_meta ->> 'estado', '')));
  if v_estado !~ '^[A-Z]{2}$' then
    v_estado := null;
  end if;

  insert into public.profiles (
    id,
    nome_completo,
    email,
    cpf_final,
    cep,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    tipo_usuario,
    status
  )
  values (
    new.id,
    v_nome,
    v_email,
    right(v_cpf, 2),
    v_cep,
    nullif(btrim(coalesce(v_meta ->> 'endereco', '')), ''),
    nullif(btrim(coalesce(v_meta ->> 'numero', '')), ''),
    nullif(btrim(coalesce(v_meta ->> 'complemento', '')), ''),
    nullif(btrim(coalesce(v_meta ->> 'bairro', '')), ''),
    nullif(btrim(coalesce(v_meta ->> 'cidade', '')), ''),
    v_estado,
    'indicador',
    'ativo'
  );

  insert into public.profile_sensitive (
    profile_id,
    cpf_encrypted,
    cpf_hash,
    telefone
  )
  values (
    new.id,
    private.cpf_criptografar(v_cpf),
    private.cpf_hash(v_cpf),
    v_telefone
  );

  v_termos := nullif(btrim(coalesce(v_meta ->> 'termos_versao', '')), '');
  v_privacidade := nullif(btrim(coalesce(v_meta ->> 'privacidade_versao', '')), '');

  if v_termos is not null then
    insert into public.consents (user_id, tipo, versao)
    values (new.id, 'termos', v_termos)
    on conflict (user_id, tipo, versao) do nothing;
  end if;

  if v_privacidade is not null then
    insert into public.consents (user_id, tipo, versao)
    values (new.id, 'privacidade', v_privacidade)
    on conflict (user_id, tipo, versao) do nothing;
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
    new.id,
    v_email,
    'SIGNUP',
    'profiles',
    new.id::text,
    jsonb_build_object(
      'nome_completo', v_nome,
      'email', v_email,
      'tipo_usuario', 'indicador',
      'termos_versao', v_termos,
      'privacidade_versao', v_privacidade
    )
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ----------------------------------------------------------------------------
-- Histórico automático de status das indicações
-- ----------------------------------------------------------------------------
create or replace function private.registrar_historico_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_observacao text := nullif(current_setting('app.motivo_status', true), '');
begin
  if tg_op = 'INSERT' then
    insert into public.referral_history (
      referral_id,
      status_anterior,
      status_novo,
      observacao,
      alterado_por
    )
    values (new.id, null, new.status, v_observacao, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.referral_history (
      referral_id,
      status_anterior,
      status_novo,
      observacao,
      alterado_por
    )
    values (new.id, old.status, new.status, v_observacao, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists referrals_status_history on public.referrals;
create trigger referrals_status_history
  after insert or update of status on public.referrals
  for each row execute function private.registrar_historico_status();

-- ----------------------------------------------------------------------------
-- Auditoria genérica
-- ----------------------------------------------------------------------------
create or replace function private.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_email text;
  v_registro_id text;
  v_old jsonb;
  v_new jsonb;
begin
  if v_actor is not null then
    select p.email into v_actor_email
    from public.profiles p
    where p.id = v_actor;

    -- Em uma exclusão do próprio perfil, o ator já não existe quando o
    -- trigger AFTER DELETE executa. A auditoria não pode violar a FK.
    if not found then
      v_actor := null;
      v_actor_email := null;
    end if;
  end if;

  if tg_op = 'DELETE' then
    v_registro_id := old.id::text;
    v_old := to_jsonb(old);
    v_new := null;
  elsif tg_op = 'UPDATE' then
    v_registro_id := new.id::text;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  else
    v_registro_id := new.id::text;
    v_old := null;
    v_new := to_jsonb(new);
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_email,
    acao,
    tabela,
    registro_id,
    dados_anteriores,
    dados_novos
  )
  values (
    v_actor,
    v_actor_email,
    tg_op,
    tg_table_name,
    v_registro_id,
    v_old,
    v_new
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Triggers de updated_at
-- ----------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists profile_sensitive_set_updated_at on public.profile_sensitive;
create trigger profile_sensitive_set_updated_at
  before update on public.profile_sensitive
  for each row execute function private.set_updated_at();

drop trigger if exists referrals_set_updated_at on public.referrals;
create trigger referrals_set_updated_at
  before update on public.referrals
  for each row execute function private.set_updated_at();

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
  before update on public.rewards
  for each row execute function private.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function private.set_updated_at();

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function private.set_updated_at();

-- ----------------------------------------------------------------------------
-- Triggers de auditoria
-- ----------------------------------------------------------------------------
drop trigger if exists profiles_audit on public.profiles;
create trigger profiles_audit
  after update or delete on public.profiles
  for each row execute function private.audit_trigger();

drop trigger if exists referrals_audit on public.referrals;
create trigger referrals_audit
  after insert or update or delete on public.referrals
  for each row execute function private.audit_trigger();

drop trigger if exists rewards_audit on public.rewards;
create trigger rewards_audit
  after insert or update or delete on public.rewards
  for each row execute function private.audit_trigger();

drop trigger if exists campaigns_audit on public.campaigns;
create trigger campaigns_audit
  after insert or update or delete on public.campaigns
  for each row execute function private.audit_trigger();

drop trigger if exists settings_audit on public.settings;
create trigger settings_audit
  after update on public.settings
  for each row execute function private.audit_trigger();

-- ----------------------------------------------------------------------------
-- Privilégios mínimos nas funções privadas criadas neste arquivo.
-- ----------------------------------------------------------------------------
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.tipo_usuario_atual() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;
