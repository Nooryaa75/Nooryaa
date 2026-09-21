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

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const selected = options.find((option) => option.value === locale) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} aria-label="Language / Langue / اللغة" className="gap-1.5">
          <Languages className="h-4 w-4" />
          {!compact && <span>{selected.short}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
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
