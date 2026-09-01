import { useState } from "react";

export type PeriodState = {
  from: string;
  to: string;
  preset: string;
  setPreset: (p: string) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
};

const PRESETS: Record<string, number> = {
  "1j": 1,
  "7j": 7,
  "30j": 30,
  "90j": 90,
  "365j": 365,
};

export function usePeriod(defaultPreset = "30j"): PeriodState {
  const [preset, setPresetState] = useState(defaultPreset);
  const [from, setFrom] = useState(() => new Date(Date.now() - PRESETS[defaultPreset] * 86400000).toISOString());
  const [to, setTo] = useState(() => new Date().toISOString());

  function setPreset(p: string) {
    setPresetState(p);
    if (PRESETS[p]) {
      setFrom(new Date(Date.now() - PRESETS[p] * 86400000).toISOString());
      setTo(new Date().toISOString());
    }
  }

  return { from, to, preset, setPreset, setFrom, setTo };
}

export function AdminPeriodPicker({ preset, setPreset, from, to, setFrom, setTo }: PeriodState) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Object.keys(PRESETS).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPreset(p)}
          className={`h-9 px-3 rounded-full text-sm border transition-colors ${
            preset === p ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {p}
        </button>
      ))}
      <input
        type="date"
        aria-label="Date de début"
        value={from.slice(0, 10)}
        onChange={(e) => {
          setPreset("custom");
          setFrom(new Date(e.target.value).toISOString());
        }}
        className="h-9 rounded-full border border-border bg-card px-3 text-sm"
      />
      <input
        type="date"
        aria-label="Date de fin"
        value={to.slice(0, 10)}
        onChange={(e) => {
          setPreset("custom");
          setTo(new Date(`${e.target.value}T23:59:59`).toISOString());
        }}
        className="h-9 rounded-full border border-border bg-card px-3 text-sm"
      />
    </div>
  );
}
