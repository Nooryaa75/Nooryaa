import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ar, enGB, fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { maxBirthdate, minBirthdate } from "@/lib/profile";

export function BirthdateCalendar({ id, value, onChange }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { locale, t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const dateLocale = { fr, en: enGB, ar }[locale];
  const selected = value ? parseISO(value) : undefined;
  const earliest = parseISO(minBirthdate());
  const latest = parseISO(maxBirthdate());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="size-4 shrink-0" />
          <span data-no-translate className={value ? "text-foreground" : "text-muted-foreground"}>
            {selected ? format(selected, "dd MMMM yyyy", { locale: dateLocale }) : t("Date de naissance")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0 pointer-events-auto" dir={dir} data-no-translate>
        <Calendar
          mode="single"
          locale={dateLocale}
          dir={dir}
          captionLayout="dropdown"
          startMonth={earliest}
          endMonth={latest}
          defaultMonth={selected ?? latest}
          selected={selected}
          disabled={[{ before: earliest }, { after: latest }]}
          reverseYears
          autoFocus
          className="pointer-events-auto text-popover-foreground"
          formatters={{ formatMonthDropdown: (date) => format(date, "MMMM", { locale: dateLocale }) }}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}