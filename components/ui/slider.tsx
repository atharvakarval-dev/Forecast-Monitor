"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  className?: string;
}

/**
 * Simple slider component using native HTML range input.
 * Styled with CSS to match a clean blue-on-gray design.
 */
function Slider({
  id,
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  onValueCommit,
  className,
}: SliderProps) {
  const currentValue = value?.[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentValue}
      onChange={(e) => onValueChange?.([parseInt(e.target.value, 10)])}
      onMouseUp={(e) =>
        onValueCommit?.([(e.target as HTMLInputElement).valueAsNumber])
      }
      onTouchEnd={(e) =>
        onValueCommit?.([(e.target as HTMLInputElement).valueAsNumber])
      }
      className={cn("slider-input w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none", className)}
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
      }}
    />
  );
}

export { Slider };
