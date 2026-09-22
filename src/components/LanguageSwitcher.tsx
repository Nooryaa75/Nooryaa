import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Locale, useI18n } from "@/lib/i18n";

const options: Array<{ value: Locale; short: string; label: string }> = [
  { value: "fr", short: "FR", label: "Français" },
  { value: "en", short: "EN", label: "English" },
  { value: "ar", short: "AR", label: "العربية" },
];

export function LanguageSwitcher({ compact = false, inline = false }: { compact?: boolean; inline?: boolean }) {
  const { locale, setLocale } = useI18n();
  const selected = options.find((option) => option.value === locale) ?? options[0];

  if (inline) {
    return (
      <div
        data-no-translate
        role="group"
        aria-label="Language / Langue / اللغة"
        className="flex w-full items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={locale === option.value}
            lang={option.value}
            dir={option.value === "ar" ? "rtl" : "ltr"}
            className={`h-8 flex-1 rounded-full px-3 text-xs font-medium transition-colors ${
              locale === option.value
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-background hover:text-primary"
            }`}
          >
            {option.value === "ar" ? option.label : option.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-no-translate variant="ghost" size={compact ? "icon" : "sm"} aria-label="Language / Langue / اللغة" className="gap-1.5">
          <Languages className="h-4 w-4" />
          {!compact && <span>{selected.short}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-no-translate align="end" className="min-w-36">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onSelect={() => setLocale(option.value)} className="justify-between gap-4">
            <span lang={option.value} dir={option.value === "ar" ? "rtl" : "ltr"}>{option.label}</span>
            {locale === option.value && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
