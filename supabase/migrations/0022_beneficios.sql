-- 0022_beneficios.sql
-- Tabela de benefícios para a central ON Benefits (Estar On Indica 5.0).

create table if not exists public.beneficios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_url text,
  regulamento text,
  condicoes text,
  data_inicio timestamptz,
  data_fim timestamptz,
  ativo boolean not null default true,
  ordem int not null default 0,
  link_url text,
  botao_texto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beneficios_ordem_idx on public.beneficios (ordem, created_at);
create index if not exists beneficios_ativo_idx on public.beneficios (ativo, data_inicio, data_fim);

alter table public.beneficios enable row level security;

-- Leitura: todos (benefícios publicados e vigentes)
drop policy if exists beneficios_select_public on public.beneficios;
create policy beneficios_select_public
  on public.beneficios
  for select
  to anon, authenticated
  using (
    ativo = true
    and (data_inicio is null or data_inicio <= now())
    and (data_fim is null or data_fim >= now())
  );

-- Leitura admin: todos
drop policy if exists beneficios_select_admin on public.beneficios;
create policy beneficios_select_admin
  on public.beneficios
  for select
  to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin
drop policy if exists beneficios_write_admin on public.beneficios;
create policy beneficios_write_admin
  on public.beneficios
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

comment on table public.beneficios is 'Benefícios exclusivos para clientes Estar On (ON Benefits).';
