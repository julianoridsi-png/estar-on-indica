"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  BellRing,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  FileText,
  GitBranch,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Target,
  Trash2,
  UserCheck,
  UserSearch,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { createClient } from "@/services/supabase/client";
import { BLOCK_CATEGORY_COLOR, BLOCK_CATEGORY_LABEL, BLOCK_TYPES, getBlockType } from "@/features/automacoes/services/registry";
import type {
  AutomationExecution,
  AutomationFlow,
  AutomationLog,
  AutomationNode,
} from "@/features/automacoes/types";

const TRIGGER_OPTIONS = [
  { value: "manual", label: "Execução manual" },
  { value: "nova_indicacao", label: "Nova indicação cadastrada" },
  { value: "status_alterado", label: "Status de indicação alterado" },
  { value: "recompensa_liberada", label: "Recompensa liberada" },
  { value: "meta_atingida", label: "Meta mensal atingida" },
];

export function AutomationStudio() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<AutomationNode[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [selectedExec, setSelectedExec] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFlow, setNewFlow] = useState({ nome: "", descricao: "", trigger_type: "manual" });
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [selectedBlockType, setSelectedBlockType] = useState<string>(BLOCK_TYPES[0].type);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("automation_flows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { toast.error("Erro ao carregar fluxos", { description: error.message }); return; }
      setFlows((data ?? []) as AutomationFlow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (flowId: string) => {
    const supabase = createClient();
    const [nodesRes, execsRes] = await Promise.all([
      supabase.from("automation_nodes").select("*").eq("flow_id", flowId).order("position", { ascending: true }),
      supabase.from("automation_executions").select("*").eq("flow_id", flowId).order("started_at", { ascending: false }).limit(10),
    ]);
    setNodes((nodesRes.data ?? []) as AutomationNode[]);
    setExecutions((execsRes.data ?? []) as AutomationExecution[]);
    setLogs([]);
    setSelectedExec(null);
  }, []);

  useEffect(() => { void loadFlows(); }, [loadFlows]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else { setNodes([]); setExecutions([]); setLogs([]); setSelectedExec(null); }
  }, [selectedId, loadDetail]);

  const selectedFlow = flows.find((f) => f.id === selectedId) ?? null;

  const handleCreate = async () => {
    if (!newFlow.nome.trim()) { toast.error("Informe o nome do fluxo."); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("automation_flows")
        .insert({ nome: newFlow.nome.trim(), descricao: newFlow.descricao.trim() || null, trigger_type: newFlow.trigger_type, ativo: false })
        .select()
        .single();
      if (error) { toast.error("Erro ao criar fluxo", { description: error.message }); return; }
      toast.success("Fluxo criado.");
      setCreating(false);
      setNewFlow({ nome: "", descricao: "", trigger_type: "manual" });
      await loadFlows();
      if (data) setSelectedId((data as AutomationFlow).id);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (flow: AutomationFlow) => {
    const supabase = createClient();
    const { error } = await supabase.from("automation_flows").update({ ativo: !flow.ativo, updated_at: new Date().toISOString() }).eq("id", flow.id);
    if (error) { toast.error("Erro ao alterar status", { description: error.message }); return; }
    toast.success(flow.ativo ? "Fluxo desativado." : "Fluxo ativado.");
    await loadFlows();
  };

  const handleDelete = async (flow: AutomationFlow) => {
    if (!confirm(`Excluir o fluxo "${flow.nome}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("automation_flows").delete().eq("id", flow.id);
    if (error) { toast.error("Erro ao excluir", { description: error.message }); return; }
    toast.success("Fluxo excluído.");
    if (selectedId === flow.id) setSelectedId(null);
    await loadFlows();
  };

  const handleAddNode = async () => {
    if (!selectedId) return;
    const bt = getBlockType(selectedBlockType);
    if (!bt) return;
    setAddingBlock(true);
    try {
      const supabase = createClient();
      const nextPos = nodes.length > 0 ? Math.max(...nodes.map((n) => n.position)) + 1 : 0;
      const { error } = await supabase.from("automation_nodes").insert({
        flow_id: selectedId,
        node_type: selectedBlockType,
        label: bt.label,
        config: {},
        position: nextPos,
      });
      if (error) { toast.error("Erro ao adicionar bloco", { description: error.message }); return; }
      toast.success("Bloco adicionado.");
      await loadDetail(selectedId);
    } finally {
      setAddingBlock(false);
    }
  };

  const handleRemoveNode = async (nodeId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("automation_nodes").delete().eq("id", nodeId);
    if (error) { toast.error("Erro ao remover", { description: error.message }); return; }
    if (selectedId) await loadDetail(selectedId);
  };

  const handleMoveNode = async (nodeId: string, dir: -1 | 1) => {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const a = nodes[idx];
    const b = nodes[targetIdx];
    const supabase = createClient();
    await supabase.from("automation_nodes").update({ position: b.position }).eq("id", a.id);
    await supabase.from("automation_nodes").update({ position: a.position }).eq("id", b.id);
    if (selectedId) await loadDetail(selectedId);
  };

  const handleUpdateNodeConfig = async (nodeId: string, config: Record<string, string>, label?: string) => {
    const supabase = createClient();
    const payload: Record<string, unknown> = { config };
    if (label) payload.label = label;
    const { error } = await supabase.from("automation_nodes").update(payload).eq("id", nodeId);
    if (error) { toast.error("Erro ao salvar", { description: error.message }); return; }
    if (selectedId) await loadDetail(selectedId);
  };

  const handleSimulate = async () => {
    if (!selectedId) return;
    setSimulating(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_simular_fluxo", { p_flow_id: selectedId });
      if (error) { toast.error("Erro na simulação", { description: error.message }); return; }
      toast.success(`Simulação concluída (${data?.nodes ?? 0} blocos).`);
      await loadDetail(selectedId);
    } finally {
      setSimulating(false);
    }
  };

  const handleLoadLogs = async (execId: string) => {
    setSelectedExec(execId);
    const supabase = createClient();
    const { data } = await supabase.from("automation_logs").select("*").eq("execution_id", execId).order("created_at", { ascending: true });
    setLogs((data ?? []) as AutomationLog[]);
  };

  const selectedExecObj = executions.find((e) => e.id === selectedExec);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-brand-600 uppercase">
            <Workflow className="size-3.5" aria-hidden="true" />
            Automation Studio
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-bold text-ink sm:text-3xl">
            Automações
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Crie fluxos de automação com blocos conectados. A simulação registra o que seria feito, sem executar ações reais.
          </p>
        </div>
        <Button size="sm" className="h-9" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-3.5" aria-hidden="true" />
          {creating ? "Cancelar" : "Novo fluxo"}
        </Button>
      </div>

      {creating ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
          <h2 className="font-heading text-base font-bold text-ink">Novo fluxo</h2>
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Nome</label>
            <Input value={newFlow.nome} onChange={(e) => setNewFlow((p) => ({ ...p, nome: e.target.value }))} placeholder="Ex.: Notificar ao aprovar indicação" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Descrição</label>
            <Textarea value={newFlow.descricao} onChange={(e) => setNewFlow((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o objetivo do fluxo" className="min-h-[60px] text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Gatilho</label>
            <Select value={newFlow.trigger_type} onValueChange={(v) => setNewFlow((p) => ({ ...p, trigger_type: v }))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-9" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Criar
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        {/* Lista de fluxos */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-heading text-base font-bold text-ink">Fluxos</h2>
          <p className="text-[11px] text-muted-foreground">Selecione um fluxo para editar.</p>
          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : flows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
              <Workflow className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold text-ink">Nenhum fluxo criado</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Clique em "Novo fluxo" para começar.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {flows.map((flow) => (
                <li key={flow.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(flow.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selectedId === flow.id
                        ? "border-brand-300 bg-brand-50"
                        : "border-border bg-background hover:border-brand-200 hover:bg-brand-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-ink">{flow.nome}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${flow.ativo ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-300"}`}>
                        {flow.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      Gatilho: {TRIGGER_OPTIONS.find((t) => t.value === flow.trigger_type)?.label ?? flow.trigger_type}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Editor do fluxo */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          {!selectedFlow ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Workflow className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-ink">Selecione um fluxo</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Escolha um fluxo na lista para editar e simular.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-bold text-ink">{selectedFlow.nome}</h2>
                  {selectedFlow.descricao ? <p className="mt-0.5 text-[11px] text-muted-foreground">{selectedFlow.descricao}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => handleToggle(selectedFlow)} disabled={false}>
                    {selectedFlow.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" className="h-8" onClick={handleSimulate} disabled={simulating || nodes.length === 0}>
                    {simulating ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    Simular
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(selectedFlow)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Blocos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Blocos do fluxo</p>
                  <span className="text-[10px] text-muted-foreground">{nodes.length} bloco(s)</span>
                </div>
                {nodes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center">
                    <p className="text-xs font-semibold text-ink">Nenhum bloco adicionado</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Adicione blocos abaixo para montar o fluxo.</p>
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {nodes.map((node, idx) => {
                      const bt = getBlockType(node.node_type);
                      const color = BLOCK_CATEGORY_COLOR[bt?.category ?? "acao"];
                      const Icon = (lucideIconMap[bt?.icone ?? "Zap"] ?? Zap);
                      return (
                        <li key={node.id} className="rounded-xl border border-border bg-background p-3">
                          <div className="flex items-start gap-3">
                            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ${color}`}>
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-ink">{node.label}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${color}`}>
                                  {BLOCK_CATEGORY_LABEL[bt?.category ?? "acao"]}
                                </span>
                              </div>
                              {bt && bt.campos.length > 0 ? (
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  {bt.campos.map((field) => (
                                    <div key={field.key} className="space-y-0.5">
                                      <label className="text-[9px] font-medium text-muted-foreground">{field.label}</label>
                                      {field.tipo === "select" ? (
                                        <select
                                          className="h-8 w-full rounded-lg border border-border bg-card px-2 text-[11px] font-semibold text-ink"
                                          value={String(node.config[field.key] ?? "")}
                                          onChange={(e) => handleUpdateNodeConfig(node.id, { ...node.config, [field.key]: e.target.value } as Record<string, string>, undefined)}
                                        >
                                          <option value="">Selecione</option>
                                          {(bt.opcoes ?? []).map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <Input
                                          className="h-8 text-[11px]"
                                          type={field.tipo === "number" ? "number" : "text"}
                                          value={String(node.config[field.key] ?? "")}
                                          onChange={(e) => {
                                            // persist on blur
                                          }}
                                          onBlur={(e) => handleUpdateNodeConfig(node.id, { ...node.config, [field.key]: e.target.value } as Record<string, string>, undefined)}
                                          placeholder={field.label}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-col gap-1">
                              <button type="button" onClick={() => handleMoveNode(node.id, -1)} disabled={idx === 0} className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-ink disabled:opacity-30" aria-label="Mover para cima">
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button type="button" onClick={() => handleMoveNode(node.id, 1)} disabled={idx === nodes.length - 1} className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-ink disabled:opacity-30" aria-label="Mover para baixo">
                                <ChevronDown className="size-3.5" />
                              </button>
                              <button type="button" onClick={() => handleRemoveNode(node.id)} className="grid size-7 place-items-center rounded-md text-red-500 transition-colors hover:bg-red-50" aria-label="Remover bloco">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          {idx < nodes.length - 1 ? (
                            <div className="ml-4 mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <ArrowRight className="size-3 rotate-90" aria-hidden="true" />
                              <span>próximo bloco</span>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* Adicionar bloco */}
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-background p-3 sm:flex-row sm:items-center">
                  <Select value={selectedBlockType} onValueChange={setSelectedBlockType}>
                    <SelectTrigger className="h-9 flex-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCK_TYPES.map((bt) => (
                        <SelectItem key={bt.type} value={bt.type}>
                          {BLOCK_CATEGORY_LABEL[bt.category]} — {bt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-9" onClick={handleAddNode} disabled={addingBlock}>
                    {addingBlock ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    Adicionar
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  A simulação registra o que seria feito em cada bloco, sem executar ações reais. Gatilhos automáticos requerem configuração de webhooks/cron (Fase 10).
                </p>
              </div>

              {/* Histórico de execuções */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Histórico de execuções</p>
                {executions.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Nenhuma execução registrada.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {executions.map((ex) => (
                      <li key={ex.id}>
                        <button
                          type="button"
                          onClick={() => handleLoadLogs(ex.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${selectedExec === ex.id ? "border-brand-300 bg-brand-50" : "border-border bg-background hover:bg-muted/40"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-ink">{ex.status}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(ex.started_at).toLocaleString("pt-BR")}</span>
                          </div>
                          {ex.error ? <p className="mt-0.5 text-[10px] text-red-600">{ex.error}</p> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedExecObj && logs.length > 0 ? (
                  <div className="mt-2 rounded-xl border border-border bg-background p-3">
                    <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Logs — {selectedExecObj.status}</p>
                    <ol className="mt-2 space-y-1">
                      {logs.map((log) => (
                        <li key={log.id} className="text-[11px] text-foreground">
                          <span className="font-semibold text-brand-700">[{log.node_type}]</span> {log.message}
                          {log.error ? <span className="text-red-600"> — {log.error}</span> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Map icon names to lucide components
import * as LucideIcons from "lucide-react";
const lucideIconMap: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {};
for (const [k, v] of Object.entries(LucideIcons)) {
  if (typeof v === "function") lucideIconMap[k] = v as React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}
