import { describe, it, expect } from "vitest";
import {
  calculateMAE,
  calculateRMSE,
  calculateBias,
  calculatePercentileAE,
  calculateCoverage,
  mergeData,
  computeAllMetrics,
} from "./calculations";
import type { DataPoint, ForecastPoint, CombinedDataPoint } from "@/types";

describe("calculations.ts", () => {
  describe("mergeData", () => {
    it("should merge actuals and forecasts correctly on exact time match", () => {
      const actuals: DataPoint[] = [
        { time: "T00:00Z", actual: 100 },
        { time: "T01:00Z", actual: 150 },
      ];
      const forecasts: ForecastPoint[] = [
        { time: "T00:00Z", forecast: 110, publishTime: "", horizonHours: 0 }, // matches
        { time: "T02:00Z", forecast: 200, publishTime: "", horizonHours: 0 }, // orphaned
      ];

      const merged = mergeData(actuals, forecasts);
      expect(merged).toHaveLength(2);
      expect(merged[0]).toEqual({ time: "T00:00Z", actual: 100, forecast: 110, error: 10 });
      expect(merged[1]).toEqual({ time: "T01:00Z", actual: 150 });
    });

    it("should handle empty arrays", () => {
      expect(mergeData([], [])).toEqual([]);
      expect(mergeData([{ time: "T", actual: 1 }], [])).toEqual([{ time: "T", actual: 1 }]);
    });
  });

  describe("Metrics Calculations", () => {
    const data: CombinedDataPoint[] = [
      { time: "1", actual: 100, forecast: 110, error: 10 },
      { time: "2", actual: 100, forecast: 90, error: -10 },
      { time: "3", actual: 100, forecast: 120, error: 20 },
      { time: "4", actual: 100 }, // missing forecast
    ];

    it("calculateMAE", () => {
      // |10| + |-10| + |20| = 40. 40 / 3 = 13.333 -> 13
      expect(calculateMAE(data)).toBe(13);
      expect(calculateMAE([])).toBe(0);
    });

    it("calculateRMSE", () => {
      // 100 + 100 + 400 = 600. 600 / 3 = 200. sqrt(200) = 14.14 -> 14
      expect(calculateRMSE(data)).toBe(14);
      expect(calculateRMSE([])).toBe(0);
    });

    it("calculateBias", () => {
      // 10 - 10 + 20 = 20. 20 / 3 = 6.666 -> 7
      expect(calculateBias(data)).toBe(7);
      expect(calculateBias([])).toBe(0);
    });

    it("calculatePercentileAE (P99)", () => {
      // Abs errors: [10, 10, 20]. P99 = 20
      expect(calculatePercentileAE(data, 99)).toBe(20);
      expect(calculatePercentileAE([], 99)).toBe(0);
      
      const manyData = Array.from({ length: 101 }, (_, i) => ({
        time: String(i),
        actual: 0,
        forecast: i,
        error: i,
      }));
      // Abs errors are 0 to 100. P99 of 101 items (index 0-100) -> index 99 -> value 99.
      expect(calculatePercentileAE(manyData, 99)).toBe(99);
    });

    it("calculateCoverage", () => {
      const actuals: DataPoint[] = [
        { time: "1", actual: 100 },
        { time: "2", actual: 100 },
        { time: "3", actual: 100 },
        { time: "4", actual: 100 },
      ];
      // 3 matches out of 4 -> 75%
      expect(calculateCoverage(actuals, data)).toBe(75);
      expect(calculateCoverage([], [])).toBe(0);
    });

    it("computeAllMetrics", () => {
      const actuals: DataPoint[] = [
        { time: "1", actual: 100 },
        { time: "2", actual: 100 },
        { time: "3", actual: 100 },
        { time: "4", actual: 100 },
      ];
      const metrics = computeAllMetrics(actuals, data);
      expect(metrics).toEqual({
        mae: 13,
        rmse: 14,
        bias: 7,
        p99: 20,
        coverage: 75,
        dataPoints: 3,
      });
    });
  });
});
