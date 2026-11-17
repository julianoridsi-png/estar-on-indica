-- ============================================================================
-- ESTAR ON INDICA — 0004
-- Privilégios e Row Level Security (RLS).
-- Regra geral: leitura mínima, escrita apenas por fluxos autorizados.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Privilégios de tabela
-- ----------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.profile_sensitive from anon, authenticated;
revoke all on table public.referrals from anon, authenticated;
revoke all on table public.referral_sensitive from anon, authenticated;
revoke all on table public.referral_history from anon, authenticated;
revoke all on table public.rewards from anon, authenticated;
revoke all on table public.campaigns from anon, authenticated;
revoke all on table public.settings from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.consents from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (
  nome_completo,
  cep,
  endereco,
  numero,
  complemento,
  bairro,
  cidade,
  estado
) on table public.profiles to authenticated;

-- Apenas o telefone é exposto. CPF criptografado e hash ficam inacessíveis.
grant select (profile_id, telefone) on table public.profile_sensitive to authenticated;

grant select on table public.referrals to authenticated;
grant update (
  status,
  observacoes,
  installed_at,
  updated_by
) on table public.referrals to authenticated;

grant select on table public.referral_history to authenticated;
grant select on table public.rewards to authenticated;

grant select on table public.campaigns to anon, authenticated;
grant select on table public.settings to anon, authenticated;
grant update (
  nome_empresa,
  logo_url,
  cor_primaria,
  cor_secundaria,
  whatsapp_suporte,
  email_suporte,
  site_url,
  recompensa_valor_centavos,
  prazo_pagamento_dias,
  termos_versao,
  privacidade_versao,
  updated_by
) on table public.settings to authenticated;

grant select on table public.audit_logs to authenticated;
grant select on table public.notifications to authenticated;
grant update (lida, lida_em) on table public.notifications to authenticated;
grant select on table public.consents to authenticated;

-- A API precisa enxergar as funções auxiliares usadas nas policies.
grant usage on schema private to authenticated;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_sensitive enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_sensitive enable row level security;
alter table public.referral_history enable row level security;
alter table public.rewards enable row level security;
alter table public.campaigns enable row level security;
alter table public.settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.consents enable row level security;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff
  on public.profiles
  for select
  to authenticated
  using (private.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- ----------------------------------------------------------------------------
-- profile_sensitive (telefone apenas; CPF permanece cifrado)
-- ----------------------------------------------------------------------------
drop policy if exists profile_sensitive_select_own_or_staff on public.profile_sensitive;
create policy profile_sensitive_select_own_or_staff
  on public.profile_sensitive
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or private.is_staff()
  );

-- ----------------------------------------------------------------------------
-- referrals
-- ----------------------------------------------------------------------------
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own
  on public.referrals
  for select
  to authenticated
  using (indicator_id = (select auth.uid()));

drop policy if exists referrals_select_staff on public.referrals;
create policy referrals_select_staff
  on public.referrals
  for select
  to authenticated
  using (private.is_staff());

drop policy if exists referrals_update_staff on public.referrals;
create policy referrals_update_staff
  on public.referrals
  for update
  to authenticated
  using (private.is_staff())
  with check (private.is_staff());

-- ----------------------------------------------------------------------------
-- referral_sensitive
-- Nenhuma policy: acesso somente por funções security definer auditadas.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- referral_history
-- ----------------------------------------------------------------------------
drop policy if exists referral_history_select_own on public.referral_history;
create policy referral_history_select_own
  on public.referral_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.referrals r
      where r.id = referral_history.referral_id
        and r.indicator_id = (select auth.uid())
    )
  );

drop policy if exists referral_history_select_staff on public.referral_history;
create policy referral_history_select_staff
  on public.referral_history
  for select
  to authenticated
  using (private.is_staff());

-- ----------------------------------------------------------------------------
-- rewards
-- O comercial não vê valores ou registros de recompensa.
-- ----------------------------------------------------------------------------
drop policy if exists rewards_select_own on public.rewards;
create policy rewards_select_own
  on public.rewards
  for select
  to authenticated
  using (indicator_id = (select auth.uid()));

drop policy if exists rewards_select_admin on public.rewards;
create policy rewards_select_admin
  on public.rewards
  for select
  to authenticated
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- campaigns
-- ----------------------------------------------------------------------------
drop policy if exists campaigns_select_active on public.campaigns;
create policy campaigns_select_active
  on public.campaigns
  for select
  to anon, authenticated
  using (ativa = true);

drop policy if exists campaigns_select_admin on public.campaigns;
create policy campaigns_select_admin
  on public.campaigns
  for select
  to authenticated
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- settings (somente dados públicos da marca)
-- ----------------------------------------------------------------------------
drop policy if exists settings_select_public on public.settings;
create policy settings_select_public
  on public.settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists settings_update_admin on public.settings;
create policy settings_update_admin
  on public.settings
  for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin() and id = 1);

-- ----------------------------------------------------------------------------
-- audit_logs (leitura apenas para administradores)
-- ----------------------------------------------------------------------------
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
  on public.audit_logs
  for select
  to authenticated
  using (private.is_admin());

-- ----------------------------------------------------------------------------
-- notifications
-- ----------------------------------------------------------------------------
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- consents
-- ----------------------------------------------------------------------------
drop policy if exists consents_select_own_or_admin on public.consents;
create policy consents_select_own_or_admin
  on public.consents
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_admin()
  );
