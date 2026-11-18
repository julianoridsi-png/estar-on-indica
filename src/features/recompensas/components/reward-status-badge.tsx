import { cn } from "@/shared/lib/utils";
import { getRewardStatusMeta } from "@/features/recompensas/services/status";
import type { RewardStatus } from "@/features/administracao/services/types";

export function RewardStatusBadge({
 status,
 className,
}: {
 status: RewardStatus;
 className?: string;
}) {
 const meta = getRewardStatusMeta(status);

 return (
 <span
 className={cn(
 "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap ring-1 ring-inset",
 meta.badgeClass,
 className,
 )}
 >
 <span
 aria-hidden="true"
 className={cn("size-1.5 rounded-full", meta.dotClass)}
 />
 {meta.label}
 </span>
 );
}
