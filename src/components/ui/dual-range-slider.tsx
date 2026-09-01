import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface DualRangeSliderProps {
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
  className?: string;
}

export function DualRangeSlider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  minLabel = "Âge minimum",
  maxLabel = "Âge maximum",
  className,
}: DualRangeSliderProps) {
  const [a, b] = value;
  const safeA = Math.min(a, b);
  const safeB = Math.max(a, b);

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-10 mb-1">
        {/* Left bubble */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${((safeA - min) / (max - min)) * 100}%` }}
        >
          <span className="text-xs text-muted-foreground whitespace-nowrap">{minLabel}</span>
          <div className="relative mt-1 rounded-xl border border-border bg-card px-3 py-1 shadow-sm">
            <span className="text-lg font-semibold text-primary">{safeA}</span>
            <span className="ml-1 text-sm text-muted-foreground">ans</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
          </div>
        </div>

        {/* Right bubble */}
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${((safeB - min) / (max - min)) * 100}%` }}
        >
          <span className="text-xs text-muted-foreground whitespace-nowrap">{maxLabel}</span>
          <div className="relative mt-1 rounded-xl border border-border bg-card px-3 py-1 shadow-sm">
            <span className="text-lg font-semibold text-primary">{safeB}</span>
            <span className="ml-1 text-sm text-muted-foreground">ans</span>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
          </div>
        </div>
      </div>

      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        value={[safeA, safeB]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => {
          const [newA, newB] = v as [number, number];
          onValueChange([newA, newB]);
        }}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        <SliderPrimitive.Thumb className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </SliderPrimitive.Root>
    </div>
  );
}
