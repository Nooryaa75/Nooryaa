import { ACTIVITIES_OPTIONS } from "@/lib/profile";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const MAX_ACTIVITIES = 3;

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

  const atLimit = selected.length >= MAX_ACTIVITIES;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">{selected.length}/{MAX_ACTIVITIES} sélectionnées maximum</p>
      <div className="grid grid-cols-2 gap-2">
        {ACTIVITIES_OPTIONS.map((a) => {
          const id = `activity-${a.replace(/\W+/g, "-")}`;
          const checked = selected.includes(a);
          return (
            <div key={a} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={!checked && atLimit}
                onCheckedChange={(c) => {
                  if (c === true && atLimit) return;
                  toggle(a, c === true);
                }}
              />
              <Label htmlFor={id} className={`text-sm font-normal cursor-pointer ${!checked && atLimit ? "opacity-50" : ""}`}>{a}</Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
