-- ============================================================================
-- 0009_cpf_opcional_coluna.sql
-- Permite CPF nulo na indicação (CPF opcional).
-- ============================================================================
alter table public.referrals
  alter column indicado_cpf_final drop not null;

alter table public.referrals
  drop constraint if exists referrals_indicado_cpf_final_check;

alter table public.referrals
  add constraint referrals_indicado_cpf_final_check
  check (indicado_cpf_final is null or indicado_cpf_final ~ '^[0-9]{2}$');