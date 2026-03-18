import type { DataPoint, ForecastPoint, CombinedDataPoint, MetricSummary as MetricSummaryType } from "@/types";

/**
 * Calculates the Mean Absolute Error (MAE) between forecast and actual values.
 */
export function calculateMAE(pairs: CombinedDataPoint[]): number {
  const valid = pairs.filter(
    (p): p is CombinedDataPoint & { forecast: number; error: number } =>
      p.forecast !== undefined && p.error !== undefined
  );
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, p) => acc + Math.abs(p.error), 0);
  return Math.round(sum / valid.length);
}

/**
 * Calculates the Root Mean Square Error (RMSE) between forecast and actual values.
 */
export function calculateRMSE(pairs: CombinedDataPoint[]): number {
  const valid = pairs.filter(
    (p): p is CombinedDataPoint & { forecast: number; error: number } =>
      p.forecast !== undefined && p.error !== undefined
  );
  if (valid.length === 0) return 0;
  const sumSq = valid.reduce((acc, p) => acc + p.error * p.error, 0);
  return Math.round(Math.sqrt(sumSq / valid.length));
}

/**
 * Computes the Pth percentile of absolute errors.
 * @param pairs - Array of combined data points
 * @param p - Percentile 0-100, e.g. 99 for P99
 */
export function calculatePercentileAE(pairs: CombinedDataPoint[], p: number): number {
  const valid = pairs.filter(
    (point): point is CombinedDataPoint & { forecast: number; error: number } =>
      point.forecast !== undefined && point.error !== undefined
  );
  if (valid.length === 0) return 0;
  
  const absErrors = valid.map(point => Math.abs(point.error)).sort((a, b) => a - b);
  const index = (p / 100) * (absErrors.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= absErrors.length) return Math.round(absErrors[lower]);
  
  const percentileValue = absErrors[lower] * (1 - weight) + absErrors[upper] * weight;
  return Math.round(percentileValue);
}

/**
 * Calculates the mean bias (average of forecast - actual).
 * Positive bias means over-forecasting on average.
 */
export function calculateBias(pairs: CombinedDataPoint[]): number {
  const valid = pairs.filter(
    (p): p is CombinedDataPoint & { forecast: number; error: number } =>
      p.forecast !== undefined && p.error !== undefined
  );
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, p) => acc + p.error, 0);
  return Math.round(sum / valid.length);
}

/**
 * Calculates the coverage percentage: what fraction of actual data points
 * have a corresponding forecast.
 */
export function calculateCoverage(
  actuals: DataPoint[],
  chartData: CombinedDataPoint[]
): number {
  if (actuals.length === 0) return 0;
  const matchedCount = chartData.filter(d => d.forecast !== undefined).length;
  return Math.round((matchedCount / actuals.length) * 1000) / 10;
}

/**
 * Merges actuals and forecasts into CombinedDataPoint[].
 * Left join on actuals by time string (exact match).
 */
export function mergeData(
  actuals: DataPoint[],
  forecasts: ForecastPoint[]
): CombinedDataPoint[] {
  const forecastMap = new Map<string, ForecastPoint>();
  for (const fp of forecasts) {
    forecastMap.set(fp.time, fp);
  }

  return actuals.map(a => {
    const fc = forecastMap.get(a.time);
    const combined: CombinedDataPoint = {
      time: a.time,
      actual: a.actual,
    };
    if (fc) {
      combined.forecast = fc.forecast;
      combined.error = fc.forecast - a.actual;
    }
    return combined;
  });
}

/**
 * Computes all forecast accuracy metrics from combined data.
 */
export function computeAllMetrics(
  actuals: DataPoint[],
  combinedData: CombinedDataPoint[]
): MetricSummaryType {
  const matchedPairs = combinedData.filter(
    (p) => p.forecast !== undefined && p.error !== undefined
  );

  return {
    mae: calculateMAE(matchedPairs),
    rmse: calculateRMSE(matchedPairs),
    p99: calculatePercentileAE(matchedPairs, 99),
    bias: calculateBias(matchedPairs),
    coverage: calculateCoverage(actuals, combinedData),
    dataPoints: matchedPairs.length,
  };
}
