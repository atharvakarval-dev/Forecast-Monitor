"use client";

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { CombinedDataPoint } from "@/types";

interface TimeSeriesChartProps {
  /** Combined data points for the chart */
  data: CombinedDataPoint[];
  /** Whether data is loading */
  isLoading: boolean;
}

/**
 * Formats MW values with commas for readability.
 */
function formatMW(value: number): string {
  return value.toLocaleString("en-GB");
}

/**
 * Custom X-axis tick component that renders dual-line date ticks.
 */
function CustomXAxisTick({
  x,
  y,
  payload,
  data,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  data: CombinedDataPoint[];
}) {
  if (!payload || x === undefined || y === undefined) return null;

  const timeStr = payload.value;
  const hm = timeStr.substring(11, 16);
  const idx = data.findIndex((d) => d.time === payload.value);
  const prevTimeStr = idx > 0 ? data[idx - 1].time : null;
  const showDate = !prevTimeStr || timeStr.substring(0, 10) !== prevTimeStr.substring(0, 10);
  const dateParts = timeStr.substring(0, 10).split("-");
  const ddmmyy = `${dateParts[2]}/${dateParts[1]}/${dateParts[0].substring(2)}`;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={12}
        fontFamily="system-ui, sans-serif"
      >
        {hm}
      </text>
      {showDate && (
        <text
          x={0}
          y={0}
          dy={30}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
        >
          {ddmmyy}
        </text>
      )}
    </g>
  );
}

/**
 * Custom tooltip component for the time series chart.
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;

  let actual: number | undefined;
  let forecast: number | undefined;

  for (const entry of payload) {
    if (entry.dataKey === "actual") actual = entry.value;
    if (entry.dataKey === "forecast") forecast = entry.value;
  }

  const error =
    actual !== undefined && forecast !== undefined
      ? forecast - actual
      : undefined;

  return (
    <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        {(() => {
          try {
            const date = label.substring(0, 10).split("-");
            const time = label.substring(11, 16);
            return `${date[2]}/${date[1]}/${date[0]} ${time} UTC`;
          } catch {
            return label;
          }
        })()}
      </p>
      <div className="space-y-1">
        {actual !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-0.5 bg-blue-500 rounded-full" />
            <span className="text-sm text-popover-foreground">Actual:</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              {formatMW(actual)} MW
            </span>
          </div>
        )}
        {forecast !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-0.5 bg-green-500 rounded-full" />
            <span className="text-sm text-popover-foreground">Forecast:</span>
            <span className="text-sm font-mono font-semibold text-foreground">
              {formatMW(forecast)} MW
            </span>
          </div>
        )}
        {error !== undefined && (
          <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
            <div
              className={`w-2.5 h-0.5 rounded-full ${
                error >= 0 ? "bg-red-400" : "bg-blue-400"
              }`}
            />
            <span className="text-sm text-popover-foreground">Error:</span>
            <span
              className={`text-sm font-mono font-semibold ${
                error >= 0 ? "text-red-600" : "text-blue-600"
              }`}
            >
              {error >= 0 ? "+" : ""}
              {formatMW(error)} MW
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Clean variant of the time-series chart based on client's mockup.
 * Clean light aesthetic, dual-line x-axis ticks, no inside-chart legend, no dots on lines.
 */
export function ClientTimeSeriesChart({ data, isLoading }: TimeSeriesChartProps) {
  if (isLoading && data.length === 0) {
    return (
      <div className="mt-6">
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="relative mt-6">
      <div className="w-full h-[280px] md:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          syncId="dashboard"
          margin={{ top: 10, right: 20, left: 70, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="0"
            stroke="#f1f5f9"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            dataKey="time"
            tick={<CustomXAxisTick data={data} />}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={80}
            height={50}
            label={{
              value: "Target Time End (UTC)",
              position: "bottom",
              offset: 15,
              style: {
                fill: "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
              },
            }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontFamily: "system-ui" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            width={55}
            label={{
              value: "Power (MW)",
              angle: -90,
              position: "insideLeft",
              offset: -5,
              style: {
                fill: "hsl(var(--muted-foreground))",
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
              },
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#15803d"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            connectNulls={true}
          />
          <Brush
            dataKey="time"
            height={30}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={() => ""}
            travellerWidth={10}
            fill="transparent"
            strokeOpacity={0.2}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
