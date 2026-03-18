"use client";

import { useEffect, useRef, useState } from "react";

interface MetricCardProps {
  /** Display label for the metric */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Unit to show after the value */
  unit: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Exaplanatory tooltip text */
  description?: string;
}

/**
 * Clean metric card with count-up animation for the light/dark theme.
 * Displays a single KPI with label, value, unit, and tooltip.
 */
export function MetricCard({ label, value, unit, icon, description }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    const duration = 800;
    const startTime = performance.now();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(Math.round(current * 10) / 10);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  const formattedValue =
    displayValue >= 1000 || displayValue <= -1000
      ? displayValue.toLocaleString("en-GB", { maximumFractionDigits: 1 })
      : displayValue.toFixed(unit === "%" ? 1 : 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900/50 p-3 transition-all hover:shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        {description && (
          <div className="group relative flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 text-[10px] text-gray-400 dark:text-gray-500 cursor-help self-start" title={description}>
            ?
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold font-mono tabular-nums text-gray-900 dark:text-gray-100">
          {formattedValue}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{unit}</span>
      </div>
    </div>
  );
}
