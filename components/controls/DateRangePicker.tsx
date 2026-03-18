"use client";

import { useCallback } from "react";

interface DateRangePickerProps {
  /** Start datetime value (YYYY-MM-DDTHH:mm format for datetime-local) */
  fromDate: string;
  /** End datetime value */
  toDate: string;
  /** Called when start datetime changes */
  onFromChange: (date: string) => void;
  /** Called when end datetime changes */
  onToChange: (date: string) => void;
}

/**
 * Date-time range picker with two clean inputs matching reference design.
 * Shows "Start Time:" and "End Time:" labels with DD/MM/YYYY HH:MM format display.
 * Uses native datetime-local inputs for cross-browser calendar + time selection.
 */
export function DateRangePicker({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
}: DateRangePickerProps) {
  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onFromChange(val);
      // Auto-adjust 'to' if from > to
      if (val > toDate) {
        onToChange(val);
      }
    },
    [onFromChange, onToChange, toDate]
  );

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onToChange(val);
      // Auto-adjust 'from' if to < from
      if (val < fromDate) {
        onFromChange(val);
      }
    },
    [onFromChange, onToChange, fromDate]
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="date-from"
          className="text-sm font-medium text-foreground mb-1"
        >
          Start Time:
        </label>
        <input
          id="date-from"
          type="datetime-local"
          value={fromDate}
          min="2025-01-01T00:00"
          max={toDate}
          onChange={handleFromChange}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all min-w-[220px]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="date-to"
          className="text-sm font-medium text-foreground mb-1"
        >
          End Time:
        </label>
        <input
          id="date-to"
          type="datetime-local"
          value={toDate}
          min={fromDate}
          onChange={handleToChange}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all min-w-[220px]"
        />
      </div>
    </div>
  );
}
