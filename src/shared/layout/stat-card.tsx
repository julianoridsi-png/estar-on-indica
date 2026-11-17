import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const TONES = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 font-heading text-2xl font-bold text-ink sm:text-[1.7rem]">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl ring-1",
            TONES[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      {description ? (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
