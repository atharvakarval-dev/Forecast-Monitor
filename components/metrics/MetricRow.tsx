"use client";

import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { MetricSummary } from "@/types";

interface MetricRowProps {
  /** Metric values to display (null while loading) */
  metrics: MetricSummary | null;
  /** Whether data is currently loading */
  isLoading: boolean;
}

/**
 * Responsive row of 5 metric cards displaying forecast accuracy KPIs.
 * Light theme, clean styling.
 */
export function MetricRow({ metrics, isLoading }: MetricRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] rounded-lg" />
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard 
        label="MAE" 
        value={metrics.mae} 
        unit="MW" 
        description="Mean Absolute Error: average magnitude of forecast errors." 
      />
      <MetricCard 
        label="RMSE" 
        value={metrics.rmse} 
        unit="MW" 
        description="Root Mean Square Error: heavily penalizes large errors." 
      />
      <MetricCard 
        label="Bias" 
        value={metrics.bias} 
        unit="MW" 
        description="Mean signed error. Positive = systematic over-forecast." 
      />
      <MetricCard 
        label="P99 Error" 
        value={metrics.p99} 
        unit="MW" 
        description="99th percentile of absolute errors. The near worst-case." 
      />
      <MetricCard 
        label="Coverage" 
        value={metrics.coverage} 
        unit="%" 
        description="% of actual data points that have a matching forecast." 
      />
    </div>
  );
}
