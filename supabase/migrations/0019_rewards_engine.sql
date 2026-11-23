-- 0019_rewards_engine.sql
-- Estrutura para o Rewards Engine — Estar On Indica 4.0.
-- Pontuação, níveis, conquistas, metas e ranking de participantes.
-- Preserva as regras atuais de recompensas (tabela rewards existente não é alterada).

-- Níveis de participantes
create table if not exists public.niveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  pontos_minimos int not null default 0,
  cor text not null default '#D2DD3A',
  icone text not null default 'star',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conquistas
create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  icone text not null default 'trophy',
  cor text not null default '#D2DD3A',
  criterio text not null,
  pontos_recompensa int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pontos dos participantes
create table if not exists public.participante_pontos (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  pontos int not null default 0,
  nivel_id uuid references public.niveis(id),
  updated_at timestamptz not null default now(),
  unique (participante_id)
);

-- Conquistas desbloqueadas
create table if not exists public.participante_conquistas (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  conquista_id uuid not null references public.conquistas(id) on delete cascade,
  desbloqueada_em timestamptz not null default now(),
  unique (participante_id, conquista_id)
);

-- Metas individuais
create table if not exists public.metas_participante (
  id uuid primary key default gen_random_uuid(),
  participante_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  descricao text,
  meta_valor int not null default 1,
  progresso int not null default 0,
  tipo text not null default 'indicacoes',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists niveis_ordem_idx on public.niveis (ordem);
create index if not exists conquistas_ativo_idx on public.conquistas (ativo);
create index if not exists participante_pontos_participante_idx on public.participante_pontos (participante_id);
create index if not exists participante_conquistas_participante_idx on public.participante_conquistas (participante_id);
create index if not exists metas_participante_participante_idx on public.metas_participante (participante_id);

alter table public.niveis enable row level security;
alter table public.conquistas enable row level security;
alter table public.participante_pontos enable row level security;
alter table public.participante_conquistas enable row level security;
alter table public.metas_participante enable row level security;

-- Leitura: todos autenticados podem ver níveis e conquistas (catálogo)
drop policy if exists niveis_select_all on public.niveis;
create policy niveis_select_all on public.niveis
  for select to authenticated using (true);

drop policy if exists conquistas_select_all on public.conquistas;
create policy conquistas_select_all on public.conquistas
  for select to authenticated using (true);

-- Pontos: participante vê os próprios; staff vê todos
drop policy if exists participante_pontos_select_own on public.participante_pontos;
create policy participante_pontos_select_own on public.participante_pontos
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists participante_conquistas_select_own on public.participante_conquistas;
create policy participante_conquistas_select_own on public.participante_conquistas
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

drop policy if exists metas_select_own on public.metas_participante;
create policy metas_select_own on public.metas_participante
  for select to authenticated
  using (participante_id = (select auth.uid()) or private.is_admin() or private.tipo_usuario_atual() = 'comercial');

-- Escrita: apenas admin (via RLS), leitura para todos
drop policy if exists niveis_write_admin on public.niveis;
create policy niveis_write_admin on public.niveis
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists conquistas_write_admin on public.conquistas;
create policy conquistas_write_admin on public.conquistas
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists participante_pontos_write_admin on public.participante_pontos;
create policy participante_pontos_write_admin on public.participante_pontos
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists participante_conquistas_write_admin on public.participante_conquistas;
create policy participante_conquistas_write_admin on public.participante_conquistas
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists metas_write_admin on public.metas_participante;
create policy metas_write_admin on public.metas_participante
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- RPC: obter perfil de gamificação do participante atual
create or replace function public.get_meu_perfil_gamificacao()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_user uuid := auth.uid();
  v_pontos public.participante_pontos%rowtype;
  v_nivel public.niveis%rowtype;
  v_conquistas jsonb;
  v_metas jsonb;
  v_ranking int;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  select * into v_pontos from public.participante_pontos where participante_id = v_user;
  if v_pontos.id is null then
    insert into public.participante_pontos (participante_id, pontos) values (v_user, 0)
    returning * into v_pontos;
  end if;

  if v_pontos.nivel_id is not null then
    select * into v_nivel from public.niveis where id = v_pontos.nivel_id;
  else
    select * into v_nivel from public.niveis where ativo = true order by pontos_minimos asc limit 1;
    if v_nivel.id is not null then
      update public.participante_pontos set nivel_id = v_nivel.id where participante_id = v_user;
    end if;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'nome', c.nome,
      'descricao', c.descricao,
      'icone', c.icone,
      'cor', c.cor,
      'pontos_recompensa', c.pontos_recompensa,
      'desbloqueada_em', pc.desbloqueada_em
    ) order by pc.desbloqueada_em desc
  ), '[]'::jsonb)
  into v_conquistas
  from public.participante_conquistas pc
  join public.conquistas c on c.id = pc.conquista_id
  where pc.participante_id = v_user;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'titulo', m.titulo,
      'descricao', m.descricao,
      'meta_valor', m.meta_valor,
      'progresso', m.progresso,
      'tipo', m.tipo
    ) order by m.created_at desc
  ), '[]'::jsonb)
  into v_metas
  from public.metas_participante m
  where m.participante_id = v_user and m.ativo = true;

  select count(*)::int + 1 into v_ranking
  from public.participante_pontos pp
  where pp.pontos > v_pontos.pontos;

  return jsonb_build_object(
    'pontos', v_pontos.pontos,
    'nivel', case when v_nivel.id is null then null else jsonb_build_object(
      'id', v_nivel.id,
      'nome', v_nivel.nome,
      'descricao', v_nivel.descricao,
      'pontos_minimos', v_nivel.pontos_minimos,
      'cor', v_nivel.cor,
      'icone', v_nivel.icone
    ) end,
    'proximo_nivel', (
      select jsonb_build_object(
        'id', n.id,
        'nome', n.nome,
        'pontos_minimos', n.pontos_minimos,
        'cor', n.cor
      )
      from public.niveis n
      where n.ativo = true and n.pontos_minimos > v_pontos.pontos
      order by n.pontos_minimos asc
      limit 1
    ),
    'conquistas', v_conquistas,
    'metas', v_metas,
    'ranking', v_ranking
  );
end;
$$;

-- RPC: listar ranking de participantes (top N)
create or replace function public.listar_ranking_participantes(p_limit int default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  v_role public.tipo_usuario := private.tipo_usuario_atual();
  v_result jsonb;
begin
  if v_role is null then
    raise exception 'Não autenticado';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'participante_id', pp.participante_id,
      'nome', p.nome_completo,
      'pontos', pp.pontos,
      'nivel', n.nome,
      'nivel_cor', n.cor
    ) order by pp.pontos desc, p.nome_completo
  ), '[]'::jsonb)
  into v_result
  from public.participante_pontos pp
  join public.profiles p on p.id = pp.participante_id
  left join public.niveis n on n.id = pp.nivel_id
  where p.tipo_usuario = 'indicador'
  limit p_limit;

  return v_result;
end;
$$;

-- RPC: listar níveis (catálogo)
create or replace function public.listar_niveis()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', n.id,
      'nome', n.nome,
      'descricao', n.descricao,
      'pontos_minimos', n.pontos_minimos,
      'cor', n.cor,
      'icone', n.icone,
      'ordem', n.ordem,
      'ativo', n.ativo
    ) order by n.ordem asc, n.pontos_minimos asc
  ), '[]'::jsonb)
  from public.niveis n
  where n.ativo = true;
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'nome', n.nome,
        'descricao', n.descricao,
        'pontos_minimos', n.pontos_minimos,
        'cor', n.cor,
        'icone', n.icone,
        'ordem', n.ordem,
        'ativo', n.ativo
      ) order by n.ordem asc, n.pontos_minimos asc
    )
    from public.niveis n
    where n.ativo = true
  ), '[]'::jsonb);
end;
$$;

-- RPC: listar conquistas (catálogo)
create or replace function public.listar_conquistas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'nome', c.nome,
        'descricao', c.descricao,
        'icone', c.icone,
        'cor', c.cor,
        'criterio', c.criterio,
        'pontos_recompensa', c.pontos_recompensa,
        'ativo', c.ativo
      ) order by c.nome
    )
    from public.conquistas c
    where c.ativo = true
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.get_meu_perfil_gamificacao() to authenticated;
grant execute on function public.listar_ranking_participantes(int) to authenticated;
grant execute on function public.listar_niveis() to authenticated;
grant execute on function public.listar_conquistas() to authenticated;

comment on table public.niveis is 'Níveis de gamificação dos participantes (Rewards Engine).';
comment on table public.conquistas is 'Conquistas desbloqueáveis pelos participantes.';
comment on table public.participante_pontos is 'Saldo de pontos e nível atual de cada participante.';
comment on table public.participante_conquistas is 'Conquistas desbloqueadas por participante.';
comment on table public.metas_participante is 'Metas individuais de participantes.';
