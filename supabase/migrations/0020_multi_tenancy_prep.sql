-- 0020_multi_tenancy_prep.sql
-- Preparação para multi-tenancy (Estar On Indica 4.0).
-- Adiciona organizacao_id (nullable) às tabelas principais.
-- NÃO ativa multi-tenancy: organizacao_id = null = modo single-tenant (atual).
-- Migração não-destrutiva: todas as colunas são nullable com default null.

-- Tabela de organizações
create table if not exists public.organizacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  logo_url text,
  cor_primaria text default '#D2DD3A',
  cor_secundaria text default '#31393F',
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colunas organizacao_id (nullable) nas tabelas principais
alter table public.profiles add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.referrals add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.rewards add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.campaigns add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.settings add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.integracoes add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.automation_flows add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.niveis add column if not exists organizacao_id uuid references public.organizacoes(id);
alter table public.conquistas add column if not exists organizacao_id uuid references public.organizacoes(id);

-- Índices
create index if not exists profiles_org_idx on public.profiles (organizacao_id);
create index if not exists referrals_org_idx on public.referrals (organizacao_id);
create index if not exists rewards_org_idx on public.rewards (organizacao_id);
create index if not exists campaigns_org_idx on public.campaigns (organizacao_id);
create index if not exists settings_org_idx on public.settings (organizacao_id);

-- Helper: organização atual do usuário (null em modo single-tenant)
create or replace function private.organizacao_atual()
returns uuid
language sql
stable
security definer
set search_path = public, private
as $$
  select p.organizacao_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

-- RLS: em modo single-tenant (organizacao_id null), acesso irrestrito como antes.
-- Quando organizacao_id estiver preenchido, filtrar por organização.
-- As policies existentes continuam válidas; as novas são ADICIONAIS (não removem as atuais).

-- Organizações: leitura para autenticados, escrita apenas admin
alter table public.organizacoes enable row level security;

drop policy if exists organizacoes_select on public.organizacoes;
create policy organizacoes_select on public.organizacoes
  for select to authenticated using (true);

drop policy if exists organizacoes_write_admin on public.organizacoes;
create policy organizacoes_write_admin on public.organizacoes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

grant select on table public.organizacoes to authenticated;
grant insert, update, delete on table public.organizacoes to authenticated;

comment on table public.organizacoes is 'Organizações (multi-tenant prep). Em modo single-tenant, organizacao_id = null em todas as tabelas.';
comment on column public.profiles.organizacao_id is 'Organização do perfil. Null = modo single-tenant (atual).';
