"use client";

import { useState, useCallback, useMemo } from "react";
import { fetchActuals, fetchForecasts } from "@/lib/api";
import { computeAllMetrics } from "@/lib/calculations";
import type {
  DataPoint,
  ForecastPoint,
  CombinedDataPoint,
  MetricSummary,
  DashboardFilters,
} from "@/types";

/** Dashboard data state returned by the hook */
export interface DashboardDataState {
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error message if fetching failed */
  error: string | null;
  /** Raw actual data points */
  actuals: DataPoint[];
  /** Raw forecast data points */
  forecasts: ForecastPoint[];
  /** Combined (left-joined) data for charting */
  combinedData: CombinedDataPoint[];
  /** Calculated metric summary (inner-join semantics) */
  metrics: MetricSummary | null;
  /** Current filter state */
  filters: DashboardFilters;
  /** Whether data has been loaded at least once */
  hasLoaded: boolean;
}

/** Default date range: Jan 8–15, 2025 (known data availability) */
const DEFAULT_FILTERS: DashboardFilters = {
  from: "2025-01-08T00:00:00Z",
  to: "2025-01-15T00:00:00Z",
  horizon: 4,
};

/**
 * Custom hook that orchestrates fetching actuals + forecasts,
 * combines them for charting, and computes accuracy metrics.
 *
 * @returns Dashboard data state and control functions
 */
export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actuals, setActuals] = useState<DataPoint[]>([]);
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [hasLoaded, setHasLoaded] = useState(false);

  /**
   * Combines actual and forecast data by time key (left join on actuals).
   * For each actual, looks up a matching forecast; if found, computes error.
   */
  const combinedData = useMemo((): CombinedDataPoint[] => {
    if (actuals.length === 0) return [];
    
    // We import and use mergeData from our pure calculations file
    return require("@/lib/calculations").mergeData(actuals, forecasts);
  }, [actuals, forecasts]);

  /**
   * Computed metrics from combined data.
   */
  const metrics = useMemo((): MetricSummary | null => {
    if (actuals.length === 0 || !hasLoaded) return null;
    return computeAllMetrics(actuals, combinedData);
  }, [actuals, combinedData, hasLoaded]);

  /**
   * Fetches fresh data with the current filters (or overridden filters).
   */
  const loadData = useCallback(
    async (overrideFilters?: Partial<DashboardFilters>) => {
      const activeFilters = { ...filters, ...overrideFilters };
      if (overrideFilters) {
        setFilters(activeFilters);
      }

      setIsLoading(true);
      setError(null);

      try {
        const [actualsResult, forecastsResult] = await Promise.all([
          fetchActuals(activeFilters.from, activeFilters.to),
          fetchForecasts(
            activeFilters.from,
            activeFilters.to,
            activeFilters.horizon
          ),
        ]);

        setActuals(actualsResult);
        setForecasts(forecastsResult);
        setHasLoaded(true);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading data.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  /**
   * Updates filter state without triggering a fetch.
   */
  const updateFilters = useCallback(
    (updates: Partial<DashboardFilters>) => {
      setFilters((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  /**
   * Retries the last data fetch.
   */
  const retry = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    isLoading,
    error,
    actuals,
    forecasts,
    combinedData,
    metrics,
    filters,
    hasLoaded,
    loadData,
    updateFilters,
    retry,
  };
}
