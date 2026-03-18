/**
 * Shared TypeScript interfaces for the UK Wind Power Forecast Dashboard.
 * All times are ISO 8601 UTC strings.
 */

// ─── Raw API Responses from Elexon BMRS ──────────────────────────

/** Raw FUELHH record from the Elexon BMRS API */
export interface ElexonFuelHHRecord {
  dataset: string;
  publishTime: string;
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  fuelType: string;
  generation: number;
}

/** Raw WINDFOR record from the Elexon BMRS API */
export interface ElexonWindForRecord {
  dataset: string;
  publishTime: string;
  startTime: string;
  generation: number;
}

// ─── Transformed Data Points ─────────────────────────────────────

/** A single actual wind generation data point */
export interface DataPoint {
  /** ISO 8601 UTC datetime string */
  time: string;
  /** Actual wind generation in MW */
  actual: number;
}

/** A single forecast data point with its publish timestamp */
export interface ForecastPoint {
  /** ISO 8601 UTC datetime string */
  time: string;
  /** Forecasted wind generation in MW */
  forecast: number;
  /** ISO 8601 UTC datetime when this forecast was published */
  publishTime: string;
  /** Forecast horizon: (time - publishTime) in hours */
  horizonHours: number;
}

/** Combined data point for charting — used after left-joining actuals and forecasts */
export interface CombinedDataPoint {
  /** ISO 8601 UTC datetime string */
  time: string;
  /** Actual wind generation in MW (always present) */
  actual: number;
  /** Forecasted wind generation in MW (may be undefined if no forecast exists) */
  forecast?: number;
  /** Error = forecast - actual (may be undefined if no forecast exists) */
  error?: number;
}

// ─── Metric Summary ──────────────────────────────────────────────

/** Summary of all forecast accuracy metrics */
export interface MetricSummary {
  /** Mean Absolute Error in MW */
  mae: number;
  /** Root Mean Square Error in MW */
  rmse: number;
  /** P99 absolute error in MW */
  p99: number;
  /** Mean bias (forecast - actual) in MW; positive = over-forecast */
  bias: number;
  /** Percentage of actual timestamps that have a matching forecast (0–100) */
  coverage: number;
  /** Number of matched data points used in calculations */
  dataPoints: number;
}

// ─── Dashboard State ─────────────────────────────────────────────

/** Dashboard filter/control state */
export interface DashboardFilters {
  /** Start of date range (ISO 8601) */
  from: string;
  /** End of date range (ISO 8601) */
  to: string;
  /** Forecast horizon in hours (0–48) */
  horizon: number;
}

// ─── API Error Response ──────────────────────────────────────────

/** Standard error response from our API routes */
export interface ApiErrorResponse {
  error: string;
  message: string;
}
