-- ============================================================================
-- 0011_status_granulares.sql
-- Adiciona novos status de indicação para fluxo comercial detalhado.
-- ============================================================================
do $$ begin
  alter type public.status_indicacao add value if not exists 'nova_indicacao';
  alter type public.status_indicacao add value if not exists 'em_contato';
  alter type public.status_indicacao add value if not exists 'em_analise_tecnica';
  alter type public.status_indicacao add value if not exists 'viabilidade_aprovada';
  alter type public.status_indicacao add value if not exists 'sem_viabilidade_tecnica';
  alter type public.status_indicacao add value if not exists 'aguardando_contratacao';
  alter type public.status_indicacao add value if not exists 'instalacao_realizada';
  alter type public.status_indicacao add value if not exists 'primeira_mensalidade_pendente';
  alter type public.status_indicacao add value if not exists 'primeira_mensalidade_confirmada';
  alter type public.status_indicacao add value if not exists 'bonificacao_aprovada';
  alter type public.status_indicacao add value if not exists 'bonificacao_disponivel';
  alter type public.status_indicacao add value if not exists 'bonificacao_paga';
  alter type public.status_indicacao add value if not exists 'cancelada';
  alter type public.status_indicacao add value if not exists 'reprovada';
exception
  when duplicate_object then null;
end $$;