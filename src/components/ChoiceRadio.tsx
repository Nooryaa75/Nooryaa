import { Label } from "@/components/ui/label";

export type ChoiceOption = { value: string; label: string };

/**
 * Ligne de question avec plusieurs choix possibles (Oui / Non / Je ne sais pas…),
 * dans le même style que YesNoRadio.
 */
export function ChoiceRadio({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: ChoiceOption[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
      <Label className="text-sm font-normal">{label}</Label>
      <div className="flex items-center gap-4">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="radio"
              name={name}
              className="accent-[color:var(--gold)] h-4 w-4"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
