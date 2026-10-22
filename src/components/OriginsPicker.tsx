import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { COUNTRIES } from "@/lib/profile";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Choix des pays d'origine : jusqu'à 3 pays, avec recherche.
 */
export function OriginsPicker({ value, onChange, max = 3 }: {
  value: string[];
  onChange: (origins: string[]) => void;
  max?: number;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const countries = useMemo(() => {
    const q = norm(query);
    const list = COUNTRIES.filter((c) => c !== "Autre");
    return q ? list.filter((c) => norm(c).includes(q)) : list;
  }, [query]);

  function toggle(country: string) {
    if (value.includes(country)) {
      onChange(value.filter((c) => c !== country));
    } else if (value.length < max) {
      onChange([...value, country]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Rechercher un pays...")}
          className="pl-9"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-border p-2">
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => {
            const selected = value.includes(country);
            const disabled = !selected && value.length >= max;
            return (
              <button
                key={country}
                type="button"
                disabled={disabled}
                onClick={() => toggle(country)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : disabled
                      ? "cursor-not-allowed border-border text-muted-foreground/40"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {country}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length > 0
          ? t("Votre sélection : ") + value.join(", ")
          : t("Vous pouvez choisir jusqu'à 3 pays d'origine.")}
      </p>
    </div>
  );
}
