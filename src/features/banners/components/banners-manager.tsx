"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { createClient } from "@/services/supabase/client";
import { listarTodosBanners, salvarBanner, excluirBanner, uploadBannerImage } from "@/features/banners/services/banners";
import { getBannerStatus } from "@/features/banners/types";
import type { Banner } from "@/features/banners/types";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  agendado: "Agendado",
  publicado: "Publicado",
  expirado: "Expirado",
  desativado: "Desativado",
};

const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-slate-100 text-slate-700 ring-slate-300",
  agendado: "bg-amber-50 text-amber-700 ring-amber-200",
  publicado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expirado: "bg-red-50 text-red-700 ring-red-200",
  desativado: "bg-muted text-muted-foreground ring-border",
};

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    imagem_url: "",
    link_url: "",
    botao_texto: "",
    data_inicio: "",
    data_fim: "",
    ativo: true,
    ordem: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarTodosBanners();
      setBanners(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({ titulo: "", descricao: "", imagem_url: "", link_url: "", botao_texto: "", data_inicio: "", data_fim: "", ativo: true, ordem: 0 });
    setEditing(null);
    setCreating(false);
  };

  const startEdit = (b: Banner) => {
    setEditing(b);
    setCreating(true);
    setForm({
      titulo: b.titulo,
      descricao: b.descricao ?? "",
      imagem_url: b.imagem_url,
      link_url: b.link_url ?? "",
      botao_texto: b.botao_texto ?? "",
      data_inicio: b.data_inicio ? b.data_inicio.slice(0, 16) : "",
      data_fim: b.data_fim ? b.data_fim.slice(0, 16) : "",
      ativo: b.ativo,
      ordem: b.ordem,
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadBannerImage(file);
      if (res.error || !res.url) {
        toast.error("Falha no upload", { description: res.error });
        return;
      }
      setForm((p) => ({ ...p, imagem_url: res.url! }));
      toast.success("Imagem enviada.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Informe o título."); return; }
    if (!form.imagem_url.trim()) { toast.error("Envie ou informe a URL da imagem."); return; }
    setSaving(true);
    try {
      const res = await salvarBanner({
        id: editing?.id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        imagem_url: form.imagem_url.trim(),
        link_url: form.link_url.trim() || null,
        botao_texto: form.botao_texto.trim() || null,
        data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : null,
        data_fim: form.data_fim ? new Date(form.data_fim).toISOString() : null,
        ativo: form.ativo,
        ordem: form.ordem,
      });
      if (!res.ok) { toast.error("Erro ao salvar", { description: res.error }); return; }
      toast.success(editing ? "Banner atualizado." : "Banner criado.");
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Excluir o banner "${b.titulo}"?`)) return;
    const res = await excluirBanner(b.id);
    if (!res.ok) { toast.error("Erro ao excluir", { description: res.error }); return; }
    toast.success("Banner excluído.");
    await load();
  };

  const handleMove = async (b: Banner, dir: -1 | 1) => {
    const idx = banners.findIndex((x) => x.id === b.id);
    const target = banners[idx + dir];
    if (!target) return;
    const supabase = createClient();
    await supabase.from("banners").update({ ordem: target.ordem }).eq("id", b.id);
    await supabase.from("banners").update({ ordem: b.ordem }).eq("id", target.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {banners.length} banner(s) cadastrado(s).
        </p>
        {!creating ? (
          <Button size="sm" className="h-9" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden="true" />
            Novo banner
          </Button>
        ) : null}
      </div>

      {creating ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-ink">
              {editing ? "Editar banner" : "Novo banner"}
            </h2>
            <button type="button" onClick={resetForm} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-ink" aria-label="Fechar">
              <X className="size-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Título</label>
              <Input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Indique e Ganhe R$ 50" className="h-9 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Descrição</label>
              <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Texto do banner" className="min-h-[60px] text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Imagem</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-ink hover:bg-muted/40">
                  <Upload className="size-3.5" aria-hidden="true" />
                  {uploading ? "Enviando..." : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {form.imagem_url ? (
                  <span className="truncate text-[11px] text-muted-foreground">{form.imagem_url}</span>
                ) : null}
              </div>
              <Input
                value={form.imagem_url}
                onChange={(e) => setForm((p) => ({ ...p, imagem_url: e.target.value }))}
                placeholder="Ou cole a URL da imagem"
                className="mt-2 h-9 text-xs"
              />
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
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data de início</label>
              <Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm((p) => ({ ...p, data_inicio: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Data de encerramento</label>
              <Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm((p) => ({ ...p, data_fim: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Ordem</label>
              <Input type="number" value={form.ordem} onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))} className="h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo}
                onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              <label htmlFor="ativo" className="text-xs font-medium text-ink">Ativo</label>
            </div>
          </div>

          {form.imagem_url ? (
            <div className="overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imagem_url} alt="Prévia" className="h-40 w-full object-cover" />
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button size="sm" className="h-9" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {editing ? "Salvar alterações" : "Criar banner"}
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
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center shadow-soft">
          <ImageIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-ink">Nenhum banner cadastrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Clique em "Novo banner" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => {
            const status = getBannerStatus(b);
            return (
              <div key={b.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imagem_url} alt={b.titulo} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{b.titulo}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${STATUS_COLOR[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  {b.descricao ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{b.descricao}</p> : null}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ordem: {b.ordem} · {b.data_inicio ? `Início: ${new Date(b.data_inicio).toLocaleDateString("pt-BR")}` : "Sem início"} · {b.data_fim ? `Fim: ${new Date(b.data_fim).toLocaleDateString("pt-BR")}` : "Sem fim"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => handleMove(b, -1)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink" aria-label="Mover para cima">
                    <ChevronUp className="size-4" />
                  </button>
                  <button type="button" onClick={() => handleMove(b, 1)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink" aria-label="Mover para baixo">
                    <ChevronDown className="size-4" />
                  </button>
                  <button type="button" onClick={() => startEdit(b)} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink" aria-label="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(b)} className="grid size-8 place-items-center rounded-lg text-red-500 transition-colors hover:bg-red-50" aria-label="Excluir">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
