import { Wind } from "lucide-react";

export function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Wind className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No data available for the selected time range
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Try adjusting the dates or forecast horizon. Ensure your start time is after January 2025.
      </p>
    </div>
  );
}
