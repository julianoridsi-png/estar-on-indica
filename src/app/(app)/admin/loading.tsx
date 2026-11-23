import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
 return (
  <div className="space-y-6 animate-pulse">
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-2">
     <Skeleton className="h-3 w-28" />
     <Skeleton className="h-8 w-56" />
     <Skeleton className="h-4 w-80" />
    </div>
    <Skeleton className="h-9 w-40" />
   </div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
     <Skeleton key={i} className="h-24 rounded-2xl" />
    ))}
   </div>
   <div className="grid gap-5 lg:grid-cols-2">
    <Skeleton className="h-72 rounded-2xl" />
    <Skeleton className="h-72 rounded-2xl" />
   </div>
   <Skeleton className="h-64 rounded-2xl" />
  </div>
 );
}
