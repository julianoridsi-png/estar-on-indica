import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  getStatusMeta,
  type StatusIndicacao,
} from "@/features/indicacoes/services/status";

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: StatusIndicacao | string;
  className?: string;
  showDot?: boolean;
}) {
  const meta = getStatusMeta(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-full border-0 px-2.5 text-[11px] font-semibold ring-1 ring-inset",
        meta.badgeClass,
        className,
      )}
      title={meta.description}
    >
      {showDot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", meta.dotClass)}
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}
