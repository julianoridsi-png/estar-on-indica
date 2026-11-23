import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
 return (
  <div className="space-y-6 animate-pulse">
   <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
    <Skeleton className="h-40 w-full rounded-2xl" />
   </div>
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-2">
     <Skeleton className="h-3 w-24" />
     <Skeleton className="h-8 w-48" />
     <Skeleton className="h-4 w-72" />
    </div>
    <div className="flex gap-2">
     <Skeleton className="h-9 w-32" />
     <Skeleton className="h-9 w-32" />
    </div>
   </div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
     <Skeleton key={i} className="h-24 rounded-2xl" />
    ))}
   </div>
   <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
    <Skeleton className="h-64 rounded-2xl" />
    <Skeleton className="h-64 rounded-2xl" />
   </div>
  </div>
 );
}
