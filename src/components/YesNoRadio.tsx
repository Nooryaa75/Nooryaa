import { Label } from "@/components/ui/label";

export function YesNoRadio({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: boolean | null | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
      <Label className="text-sm font-normal">{label}</Label>
      <div className="flex items-center gap-4">
        {[
          { v: true, l: "Oui" },
          { v: false, l: "Non" },
        ].map((o) => (
          <label key={o.l} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              className="accent-[color:var(--gold)] h-4 w-4"
              checked={value === o.v}
              onChange={() => onChange(o.v)}
            />
            {o.l}
          </label>
        ))}
      </div>
    </div>
  );
}
