"use client";

import { Slider } from "@/components/ui/slider";

interface HorizonSliderProps {
  /** Current horizon value in hours */
  value: number;
  /** Called when slider value changes */
  onChange: (value: number) => void;
  /** Called when user commits the value (e.g. onPointerUp) */
  onCommit?: (value: number) => void;
}

/**
 * Forecast horizon slider (0–48 hours) with real-time value label.
 * Matches reference design: "Forecast Horizon: Xh" label with clean slider.
 * Blue thumb, gray track, blue fill.
 */
export function HorizonSlider({ value, onChange, onCommit }: HorizonSliderProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[260px]">
      <label
        htmlFor="horizon-slider"
        className="text-sm font-medium text-foreground"
      >
        Forecast Horizon: <span className="font-semibold">{value}h</span>
      </label>
      <div className="pt-1">
        <Slider
          id="horizon-slider"
          min={0}
          max={48}
          step={1}
          value={[value]}
          onValueChange={(vals) => onChange(vals[0])}
          onValueCommit={(vals) => onCommit?.(vals[0])}
          className="w-full"
        />
      </div>
    </div>
  );
}
