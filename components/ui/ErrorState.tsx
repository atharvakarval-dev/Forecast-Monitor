import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-destructive mb-2">
        Failed to Load Data
      </h3>
      <p className="text-sm text-destructive/80 mb-6 max-w-md mx-auto">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive outline-none focus:ring-2 focus:ring-destructive/30 hover:bg-destructive/20 transition-all active:scale-95"
      >
        <RefreshCcw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
