-- 0021_banners_carrossel.sql
-- Tabela de banners para o Hero Carousel (Estar On Indica 5.0).
-- Status: rascunho, agendado, publicado, expirado, desativado.

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  imagem_url text not null,
  link_url text,
  botao_texto text,
  data_inicio timestamptz,
  data_fim timestamptz,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banners_ordem_idx on public.banners (ordem, created_at);
create index if not exists banners_ativo_idx on public.banners (ativo, data_inicio, data_fim);

alter table public.banners enable row level security;

-- Leitura: todos (banners publicados e vigentes)
drop policy if exists banners_select_public on public.banners;
create policy banners_select_public
  on public.banners
  for select
  to anon, authenticated
  using (
    ativo = true
    and (data_inicio is null or data_inicio <= now())
    and (data_fim is null or data_fim >= now())
  );

-- Leitura admin: todos os banners (inclusive rascunhos/expirados)
drop policy if exists banners_select_admin on public.banners;
create policy banners_select_admin
  on public.banners
  for select
  to authenticated
  using (private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin
drop policy if exists banners_write_admin on public.banners;
create policy banners_write_admin
  on public.banners
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- Storage bucket para imagens de banners
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Storage policies: leitura pública, escrita apenas admin
drop policy if exists banners_storage_select on storage.objects;
create policy banners_storage_select
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'banners');

drop policy if exists banners_storage_insert on storage.objects;
create policy banners_storage_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'banners' and private.is_admin());

drop policy if exists banners_storage_update on storage.objects;
create policy banners_storage_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'banners' and private.is_admin())
  with check (bucket_id = 'banners' and private.is_admin());

drop policy if exists banners_storage_delete on storage.objects;
create policy banners_storage_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'banners' and private.is_admin());

comment on table public.banners is 'Banners do Hero Carousel (Estar On Indica 5.0). Uma integração só é publicada após configuração real.';
