"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Link2,
  Loader2,
  Plug,
  PlugZap,
  RefreshCw,
  Save,
  ShieldCheck,
  Unplug,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { createClient } from "@/services/supabase/client";
import {
  INTEGRATION_PROVIDERS,
  getProvider,
} from "@/features/integracoes/services/registry";
import type {
  IntegrationProvider,
  IntegrationRecord,
  IntegrationStatus,
} from "@/features/integracoes/types";

const STATUS_META: Record<IntegrationStatus, { label: string; className: string }> = {
  nao_configurada: { label: "Não configurada", className: "bg-muted text-muted-foreground ring-border" },
  configurada: { label: "Configurada", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  conectada: { label: "Conectada", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  erro: { label: "Erro", className: "bg-red-50 text-red-700 ring-red-200" },
  desconectada: { label: "Desconectada", className: "bg-slate-100 text-slate-700 ring-slate-300" },
};

const CATEGORY_LABEL: Record<string, string> = {
  comunicacao: "Comunicação",
  automacao: "Automação",
  crm: "CRM",
  dados: "Dados",
  email: "E-mail",
  api: "API",
};

export function ConnectHub() {
  const [records, setRecords] = useState<IntegrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_listar_integracoes");
      if (error) {
        toast.error("Não foi possível carregar as integrações", { description: error.message });
        setRecords([]);
        return;
      }
      const list = (data ?? []) as IntegrationRecord[];
      setRecords(list);
      const cfg: Record<string, Record<string, string>> = {};
      for (const r of list) {
        cfg[r.provider] = (r.config ?? {}) as Record<string, string>;
      }
      setConfigs(cfg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const getRecord = (providerId: string) =>
    records.find((r) => r.provider === providerId);

  const getStatus = (providerId: string): IntegrationStatus =>
    getRecord(providerId)?.status ?? "nao_configurada";

  const handleSave = async (provider: IntegrationProvider) => {
    const cfg = configs[provider.id] ?? {};
    const missing = provider.campos.filter((c) => !cfg[c.key]?.trim());
    if (missing.length > 0) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: missing.map((m) => m.label).join(", "),
      });
      return;
    }
    setSaving(provider.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_salvar_integracao", {
        p_provider: provider.id,
        p_config: cfg,
      });
      if (error) {
        toast.error("Não foi possível salvar", { description: error.message });
        return;
      }
      toast.success("Configuração salva.");
      await load();
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (provider: IntegrationProvider) => {
    const cfg = configs[provider.id] ?? {};
    const missing = provider.campos.filter((c) => !cfg[c.key]?.trim());
    if (missing.length > 0) {
      toast.error("Preencha as credenciais antes de testar.");
      return;
    }
    setTesting(provider.id);
    try {
      const supabase = createClient();
      // Teste real requer conta/credenciais válidas no provedor externo.
      // Aqui registramos a tentativa honestamente: sem credenciais verificadas,
      // o resultado é "erro" com mensagem explicativa.
      const { data, error } = await supabase.rpc("admin_testar_integracao", {
        p_provider: provider.id,
        p_sucesso: false,
        p_erro:
          "Teste real requer conta e credenciais válidas no provedor externo. Verifique a configuração e tente novamente após validar no provedor.",
      });
      if (error) {
        toast.error("Falha ao registrar teste", { description: error.message });
        return;
      }
      toast.warning("Teste registrado: " + (data?.status ?? "erro"));
      await load();
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async (provider: IntegrationProvider) => {
    setDisconnecting(provider.id);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_desconectar_integracao", {
        p_provider: provider.id,
      });
      if (error) {
        toast.error("Não foi possível desconectar", { description: error.message });
        return;
      }
      toast.success("Integração desconectada.");
      setConfigs((prev) => {
        const next = { ...prev };
        delete next[provider.id];
        return next;
      });
      await load();
    } finally {
      setDisconnecting(null);
    }
  };

  const grouped = INTEGRATION_PROVIDERS.reduce<Record<string, IntegrationProvider[]>>(
    (acc, p) => {
      (acc[p.categoria] ??= []).push(p);
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([cat, providers]) => (
        <section key={cat} aria-label={CATEGORY_LABEL[cat]} className="space-y-3">
          <h2 className="font-heading text-sm font-bold text-ink uppercase tracking-[0.16em]">
            {CATEGORY_LABEL[cat]}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {providers.map((provider) => {
              const status = getStatus(provider.id);
              const meta = STATUS_META[status];
              const cfg = configs[provider.id] ?? {};
              const isOpen = expanded === provider.id;
              const record = getRecord(provider.id);
              return (
                <article
                  key={provider.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                        <Plug className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-sm font-bold text-ink">{provider.nome}</h3>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                          {provider.descricao}
                        </p>
                        <span
                          className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : provider.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                      aria-label={isOpen ? "Recolher" : "Expandir"}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-border bg-background/40 p-5 space-y-3">
                      {provider.campos.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                            {field.label}
                          </label>
                          <Input
                            type={field.tipo === "secret" ? "password" : "text"}
                            value={cfg[field.key] ?? ""}
                            onChange={(e) =>
                              setConfigs((prev) => ({
                                ...prev,
                                [provider.id]: { ...prev[provider.id], [field.key]: e.target.value },
                              }))
                            }
                            placeholder={field.tipo === "secret" ? "••••••••" : ""}
                            className="h-9 text-xs"
                          />
                        </div>
                      ))}
                      {provider.dica ? (
                        <p className="text-[10px] text-muted-foreground">{provider.dica}</p>
                      ) : null}
                      {record?.last_error ? (
                        <p className="text-[10px] text-red-600">Último erro: {record.last_error}</p>
                      ) : null}
                      {record?.last_tested_at ? (
                        <p className="text-[10px] text-muted-foreground">
                          Último teste: {new Date(record.last_tested_at).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => handleSave(provider)}
                          disabled={saving === provider.id}
                        >
                          {saving === provider.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Save className="size-3.5" />
                          )}
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleTest(provider)}
                          disabled={testing === provider.id}
                        >
                          {testing === provider.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="size-3.5" />
                          )}
                          Testar conexão
                        </Button>
                        {status !== "nao_configurada" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDisconnect(provider)}
                            disabled={disconnecting === provider.id}
                          >
                            {disconnecting === provider.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Unplug className="size-3.5" />
                            )}
                            Desconectar
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Uma integração só é marcada como <strong>Conectada</strong> após um teste real bem-sucedido no provedor externo.
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
