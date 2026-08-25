import { PERSONALITY_OPTIONS } from "@/lib/profile";
import { Label } from "@/components/ui/label";

export function PersonalityPicker({
  value,
  onChange,
  name = "personality",
  allowAny = false,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  name?: string;
  allowAny?: boolean;
}) {
  const options = allowAny ? ["Indifférent", ...PERSONALITY_OPTIONS] : [...PERSONALITY_OPTIONS];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((p) => {
        const id = `${name}-${p.replace(/\W+/g, "-")}`;
        return (
          <div key={p} className="flex items-center gap-2">
            <input
              type="radio"
              id={id}
              name={name}
              className="accent-[color:var(--gold)] h-4 w-4"
              checked={p === "Indifférent" ? !value : value === p}
              onChange={() => onChange(p === "Indifférent" ? null : p)}
            />
            <Label htmlFor={id} className="text-sm font-normal cursor-pointer">{p}</Label>
          </div>
        );
      })}
    </div>
  );
}
