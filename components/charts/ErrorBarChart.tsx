"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type { CombinedDataPoint } from "@/types";

interface ErrorBarChartProps {
  /** Combined data points (only those with both actual and forecast will be shown) */
  data: CombinedDataPoint[];
  /** Whether data is loading */
  isLoading: boolean;
}

/**
 * Custom tooltip for the error bar chart — light theme.
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload[0] || !label) return null;

  const error = payload[0].value;
  const isOverForecast = error >= 0;

  return (
    <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2 font-mono">
        {(() => {
          try {
            return format(parseISO(label), "dd/MM/yyyy HH:mm") + " UTC";
          } catch {
            return label;
          }
        })()}
      </p>
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-sm ${
            isOverForecast ? "bg-red-400" : "bg-blue-400"
          }`}
        />
        <span className="text-sm text-popover-foreground">
          {isOverForecast ? "Over-forecast" : "Under-forecast"}:
        </span>
        <span
          className={`text-sm font-mono font-semibold ${
            isOverForecast ? "text-red-600" : "text-blue-600"
          }`}
        >
          {error >= 0 ? "+" : ""}
          {error.toLocaleString("en-GB")} MW
        </span>
      </div>
    </div>
  );
}

/**
 * Error bar chart showing (forecast - actual) per timestamp.
 * Red bars for over-forecast, blue bars for under-forecast.
 * Clean light theme matching the overall design.
 */
export function ErrorBarChart({ data, isLoading }: ErrorBarChartProps) {
  if (isLoading && data.length === 0) {
    return (
      <div className="mt-6">
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </div>
    );
  }

  const errorData = data.filter(
    (d): d is CombinedDataPoint & { error: number } => d.error !== undefined
  );

  if (errorData.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Forecast Error
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={errorData}
          syncId="dashboard"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={(time: string) => {
              try {
                return format(parseISO(time), "HH:mm");
              } catch {
                return time;
              }
            }}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(v: number) =>
              v >= 1000 || v <= -1000
                ? `${(v / 1000).toFixed(1)}k`
                : v.toString()
            }
            label={{
              value: "Error (MW)",
              angle: -90,
              position: "insideLeft",
              offset: -5,
              style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--muted)" }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
          <Bar dataKey="error" radius={[2, 2, 0, 0]} maxBarSize={6}>
            {errorData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.error >= 0 ? "#f87171" : "#3b82f6"}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400/70" />
          <span>Over-forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" />
          <span>Under-forecast</span>
        </div>
      </div>
    </div>
  );
}
