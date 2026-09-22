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
  unit?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

function Bubble({
  label,
  value,
  unit,
  formatValue,
  innerRef,
  style,
}: {
  label: string;
  value: number;
  unit: string;
  formatValue?: (value: number) => string;
  innerRef: React.Ref<HTMLDivElement>;
  style: React.CSSProperties;
}) {
  return (
    <div ref={innerRef} className="absolute top-0 flex flex-col items-center" style={style}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="relative mt-1 rounded-xl border border-border bg-card px-3 py-1 shadow-sm">
        <span className="text-lg font-bold text-primary" data-no-translate>{formatValue ? formatValue(value) : value}</span>
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
      </div>
    </div>
  );
}

export function DualRangeSlider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  minLabel = "Âge minimum",
  maxLabel = "Âge maximum",
  unit = "ans",
  formatValue,
  className,
}: DualRangeSliderProps) {
  const [a, b] = value;
  const safeA = Math.min(a, b);
  const safeB = Math.max(a, b);
  const pctA = ((safeA - min) / (max - min)) * 100;
  const pctB = ((safeB - min) / (max - min)) * 100;

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const minRef = React.useRef<HTMLDivElement>(null);
  const maxRef = React.useRef<HTMLDivElement>(null);
  const [centers, setCenters] = React.useState<{ a: number; b: number } | null>(null);

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const minEl = minRef.current;
    const maxEl = maxRef.current;
    if (!wrap || !minEl || !maxEl) return;
    const W = wrap.clientWidth;
    const wA = minEl.offsetWidth;
    const wB = maxEl.offsetWidth;
    const gap = 8;
    let cA = (pctA / 100) * W;
    let cB = (pctB / 100) * W;
    // Prevent overlap: push bubbles apart symmetrically if too close
    if (cB - wB / 2 < cA + wA / 2 + gap) {
      const overlap = cA + wA / 2 + gap - (cB - wB / 2);
      cA -= overlap / 2;
      cB += overlap / 2;
    }
    // Keep bubbles fully inside the container
    cA = Math.max(wA / 2, Math.min(W - wA / 2, cA));
    cB = Math.max(wB / 2, Math.min(W - wB / 2, cB));
    setCenters({ a: cA, b: cB });
  }, [pctA, pctB, safeA, safeB]);

  return (
    <div className={cn("w-full", className)}>
      <div ref={wrapRef} className="relative h-14 mb-1">
        <Bubble
          innerRef={minRef}
          label={minLabel}
          value={safeA}
          unit={unit}
          formatValue={formatValue}
          style={
            centers
              ? { left: `${centers.a}px`, transform: "translateX(-50%)" }
              : { left: `${pctA}%`, transform: "translateX(-50%)", visibility: "hidden" }
          }
        />
        <Bubble
          innerRef={maxRef}
          label={maxLabel}
          value={safeB}
          unit={unit}
          formatValue={formatValue}
          style={
            centers
              ? { left: `${centers.b}px`, transform: "translateX(-50%)" }
              : { left: `${pctB}%`, transform: "translateX(-50%)", visibility: "hidden" }
          }
        />
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
