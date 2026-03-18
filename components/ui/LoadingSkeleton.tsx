import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-8 fade-in animate-in duration-500">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-lg w-full bg-muted/50" />
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-lg w-full bg-muted/50" />
      <Skeleton className="h-[250px] rounded-lg w-full bg-muted/50" />
    </div>
  );
}
