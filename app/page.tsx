"use client";

import { useCallback, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricRow } from "@/components/metrics/MetricRow";
import { ClientTimeSeriesChart } from "@/components/charts/ClientTimeSeriesChart";
import { ErrorBarChart } from "@/components/charts/ErrorBarChart";
import { DateRangePicker } from "@/components/controls/DateRangePicker";
import { HorizonSlider } from "@/components/controls/HorizonSlider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useEffect } from "react";

/**
 * Converts a datetime-local value (YYYY-MM-DDTHH:mm) to an ISO UTC string.
 */
function localToIso(datetimeLocal: string): string {
  return datetimeLocal ? `${datetimeLocal}:00Z` : "";
}

/**
 * Main dashboard page component.
 * Clean, minimal, data-focused layout matching the reference design.
 */
export default function DashboardPage() {
  const {
    isLoading,
    error,
    combinedData,
    metrics,
    hasLoaded,
    loadData,
    retry,
  } = useDashboardData();

  // datetime-local format: YYYY-MM-DDTHH:mm
  const [localFrom, setLocalFrom] = useState("2025-01-08T08:00");
  const [localTo, setLocalTo] = useState("2025-01-15T08:00");
  const [localHorizon, setLocalHorizon] = useState(4);

  /**
   * Triggers data fetch with current control values.
   */
  const handleApply = useCallback(() => {
    const fromIso = localToIso(localFrom);
    const toIso = localToIso(localTo);
    loadData({ from: fromIso, to: toIso, horizon: localHorizon });
  }, [localFrom, localTo, localHorizon, loadData]);

  /**
   * Handle Enter key on inputs to trigger fetch.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleApply();
    },
    [handleApply]
  );

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (!hasLoaded && !isLoading) {
      const fromIso = localToIso(localFrom);
      const toIso = localToIso(localTo);
      loadData({ from: fromIso, to: toIso, horizon: localHorizon });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Header ────────────────────────────────────────────── */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label="Wind Turbine">
              🌬️
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              UK Wind Power <span className="text-muted-foreground font-normal">— Forecast Monitor</span>
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* ─── Controls Row ──────────────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm"
          onKeyDown={handleKeyDown}
        >
          <DateRangePicker
            fromDate={localFrom}
            toDate={localTo}
            onFromChange={setLocalFrom}
            onToChange={setLocalTo}
          />
          <div className="flex-1 max-w-xs">
            <HorizonSlider
              value={localHorizon}
              onChange={setLocalHorizon}
              onCommit={() => handleApply()}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading…
              </>
            ) : (
              "Load Data"
            )}
          </button>
        </div>

        {/* ─── Loading Skeletons ──────────────────────────────────── */}
        {isLoading && !hasLoaded && <LoadingSkeleton />}

        {/* ─── Error State ───────────────────────────────────────── */}
        {error && <ErrorState message={error} onRetry={retry} />}

        {/* ─── Empty Data State (loaded but no results) ──────────── */}
        {!isLoading && !error && hasLoaded && combinedData.length === 0 && (
          <EmptyState />
        )}

        {/* ─── Metrics Row ───────────────────────────────────────── */}
        {hasLoaded && !error && combinedData.length > 0 && (
          <div className="mt-6">
            <MetricRow metrics={metrics} isLoading={isLoading} />
          </div>
        )}

        {/* ─── Main Time Series Chart (Client Style) ─────────────── */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-[-1rem]">Wind Power Forecast <span className="text-muted-foreground font-normal">— Generation vs. Forecasted</span></h2>
          <ClientTimeSeriesChart data={combinedData} isLoading={isLoading} />
        </div>

        {/* ─── Error Bar Chart ───────────────────────────────────── */}
        {hasLoaded && !error && combinedData.length > 0 && (
          <ErrorBarChart data={combinedData} isLoading={isLoading} />
        )}

        {/* ─── Footer ────────────────────────────────────────────── */}
        {hasLoaded && (
          <footer className="mt-8 border-t border-gray-100 pt-4 pb-4">
            <p className="text-center text-xs text-gray-400">
              Data sourced from{" "}
              <a
                href="https://bmrs.elexon.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-500 underline underline-offset-2 transition-colors"
              >
                Elexon BMRS
              </a>{" "}
              · All times in UTC
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
