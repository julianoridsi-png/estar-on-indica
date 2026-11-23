"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Gift,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { createClient } from "@/services/supabase/client";
import { listarTodosBeneficios, salvarBeneficio, excluirBeneficio } from "@/features/beneficios/services/beneficios";
import type { Beneficio } from "@/features/beneficios/types";

export function BenefitsManager() {
  const [items, setItems] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Beneficio | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    titulo: "", descricao: "", imagem_url: "", regulamento: "", condicoes: "",
    data_inicio: "", data_fim: "", ativo: true, ordem: 0, link_url: "", botao_texto: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listarTodosBeneficios()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setForm({ titulo: "", descricao: "", imagem_url: "", regulamento: "", condicoes: "", data_inicio: "", data_fim: "", ativo: true, ordem: 0, link_url: "", botao_texto: "" });
    setEditing(null); setCreating(false);
  };

  const startEdit = (b: Beneficio) => {
    setEditing(b); setCreating(true);
    setForm({
      titulo: b.titulo, descricao: b.descricao ?? "", imagem_url: b.imagem_url ?? "",
      regulamento: b.regulamento ?? "", condicoes: b.condicoes ?? "",
      data_inicio: b.data_inicio ? b.data_inicio.slice(0, 16) : "",
      data_fim: b.data_fim ? b.data_fim.slice(0, 16) : "",
      ativo: b.ativo, ordem: b.ordem, link_url: b.link_url ?? "", botao_texto: b.botao_texto ?? "",
    });
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Informe o título."); return; }
    setSaving(true);
    try {
      const res = await salvarBeneficio({
        id: editing?.id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        imagem_url: form.imagem_url.trim() || null,
        regulamento: form.regulamento.trim() || null,
        condicoes: form.condicoes.trim() || null,
        data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : null,
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : null,
        ativo: form.ativo, ordem: form.ordem,
        link_url: form.link_url.trim() || null,
        botao_texto: form.botao_texto.trim() || null,
      });
      if (!res.ok) { toast.error("Erro ao salvar", { description: res.error }); return; }
      toast.success(editing ? "Benefício atualizado." : "Benefício criado.");
      resetForm(); await load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (b: Beneficio) => {
    if (!confirm(`Excluir o benefício "${b.titulo}"?`)) return;
    const res = await excluirBeneficio(b.id);
    if (!res.ok) { toast.error("Erro ao excluir", { description: res.error }); return; }
    toast.success("Benefício excluído."); await load();
  };

  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{items.length} benefício(s) cadastrado(s).</p>
        {!creating ? (
          <Button size="sm" className="h-9" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden="true" /> Novo benefício
          </Button>
        ) : null}
      </div>

      {creating ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-ink">{editing ? "Editar benefício" : "Novo benefício"}</h2>
            <button type="button" onClick={resetForm} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink" aria-label="Fechar"><X className="size-4" /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Título</label>
              <Input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Desconto na mensalidade" className="h-9 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Descrição</label>
              <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Descrição do benefício" className="min-h-[60px] text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">URL da imagem</label>
              <Input value={form.imagem_url} onChange={(e) => setForm((p) => ({ ...p, imagem_url: e.target.value }))} placeholder="https://..." className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Regulamento</label>
              <Textarea value={form.regulamento} onChange={(e) => setForm((p) => ({ ...p, regulamento: e.target.value }))} placeholder="Regras do benefício" className="min-h-[60px] text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Condições</label>
              <Textarea value={form.condicoes} onChange={(e) => setForm((p) => ({ ...p, condicoes: e.target.value }))} placeholder="Condições de participação" className="min-h-[60px] text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data de início</label>
              <Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data de encerramento</label>
              <Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Link (destino)</label>
              <Input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} placeholder="/cadastro" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Texto do botão</label>
              <Input value={form.botao_texto} onChange={(e) => setForm((p) => ({ ...p, botao_texto: e.target.value }))} placeholder="Saiba mais" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Ordem</label>
              <Input type="number" value={form.ordem} onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))} className="h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="ativo-b" checked={form.ativo} onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))} className="size-4 rounded border-border" />
              <label htmlFor="ativo-b" className="text-xs font-medium text-ink">Ativo</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-9" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {editing ? "Salvar alterações" : "Criar benefício"}
            </Button>
            <Button size="sm" variant="outline" className="h-9" onClick={resetForm}>Cancelar</Button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <Gift className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Nenhum benefício cadastrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Clique em "Novo benefício" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{b.titulo}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${b.ativo ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-muted text-muted-foreground ring-border"}`}>
                      {b.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {b.descricao ? <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{b.descricao}</p> : null}
                  {b.condicoes ? <p className="mt-1 text-[10px] text-muted-foreground"><strong>Condições:</strong> {b.condicoes}</p> : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {b.data_inicio ? `Início: ${new Date(b.data_inicio).toLocaleDateString("pt-BR")}` : "Sem início"} · {b.data_fim ? `Fim: ${new Date(b.data_fim).toLocaleDateString("pt-BR")}` : "Sem fim"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => startEdit(b)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(b)} className="grid size-8 place-items-center rounded-lg text-red-500 transition-colors hover:bg-red-50" aria-label="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {b.regulamento ? (
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-brand-700 hover:underline"
                >
                  {expanded === b.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  {expanded === b.id ? "Ocultar regulamento" : "Ver regulamento"}
                </button>
              ) : null}
              {expanded === b.id && b.regulamento ? (
                <p className="mt-2 rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">{b.regulamento}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
