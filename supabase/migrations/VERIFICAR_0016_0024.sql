-- ============================================================================
-- ESTAR ON INDICA - verificacao das migrations 0016 a 0024
-- Rode DEPOIS de executar RUN_0016_0024.sql (ou 0016-0023 + 0024).
-- Pode rodar quantas vezes quiser: sao apenas consultas (nao altera dados).
-- ============================================================================

-- 1) Tabelas esperadas (devem aparecer 16 linhas, todas com rowsecurity = true)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'integracoes', 'integration_events',
    'automation_flows', 'automation_nodes', 'automation_edges',
    'automation_executions', 'automation_logs',
    'niveis', 'conquistas', 'participante_pontos',
    'participante_conquistas', 'metas_participante',
    'organizacoes', 'banners', 'beneficios', 'followup_alerts'
  )
order by tablename;

-- 2) Colunas de acompanhamento em referrals (devem aparecer 3 linhas)
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'referrals'
  and column_name in ('last_status_change_at', 'followup_level', 'followup_resolved')
order by column_name;

-- 3) Funcoes esperadas (devem aparecer 15 linhas)
select p.proname, pg_get_function_identity_arguments(p.oid) as argumentos
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname in (
    'admin_alterar_permissao_usuario', 'admin_alterar_status_usuario',
    'admin_salvar_integracao', 'admin_testar_integracao',
    'admin_desconectar_integracao', 'admin_listar_integracoes',
    'admin_simular_fluxo',
    'get_meu_perfil_gamificacao', 'listar_ranking_participantes',
    'listar_niveis', 'listar_conquistas',
    'processar_smart_followup', 'listar_followup_alerts',
    'resolver_followup_alerta', 'saude_cron_status'
  )
order by p.proname;

-- 4) Banner inicial da campanha (deve aparecer 1 linha ativa)
select titulo, ativo, ordem
from public.banners
order by ordem;

-- 5) Teste REAL do Smart Follow-Up (nao apaga nada)
--    Resultado esperado: JSON com "ok": true.
--    Antes da 0024 este comando falhava com "record r is not assigned yet".
select public.processar_smart_followup() as resultado;

-- 6) Alertas gerados ate agora
select resolvido, count(*) as quantidade
from public.followup_alerts
group by resolvido
order by resolvido;

-- 7) Status do agendamento pg_cron (job, agenda, ultima execucao)
--    Pode rodar no SQL Editor. O retorno deve mostrar job_existe = true.
select public.saude_cron_status() as cron_status;
