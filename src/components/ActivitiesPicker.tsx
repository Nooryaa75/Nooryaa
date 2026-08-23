import { ACTIVITIES_OPTIONS } from "@/lib/profile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ActivitiesPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  const selected = (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function toggle(activity: string, checked: boolean) {
    const next = checked
      ? [...selected, activity]
      : selected.filter((a) => a !== activity);
    const ordered = ACTIVITIES_OPTIONS.filter((a) => next.includes(a));
    const extras = next.filter((a) => !ACTIVITIES_OPTIONS.includes(a as never));
    onChange([...ordered, ...extras].join(", "));
  }

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {ACTIVITIES_OPTIONS.map((a) => {
        const id = `activity-${a.replace(/\W+/g, "-")}`;
        const checked = selected.includes(a);
        return (
          <div key={a} className="flex items-center gap-2">
            <Checkbox id={id} checked={checked} onCheckedChange={(c) => toggle(a, c === true)} />
            <Label htmlFor={id} className="text-sm font-normal cursor-pointer">{a}</Label>
          </div>
        );
      })}
    </div>
  );
}
