import { useEffect, useState } from "react";
import { Quote, Heart } from "lucide-react";
import { getDailyReminder, dayIndex, type DailyReminder as Reminder } from "@/lib/reminders";
import { useI18n } from "@/lib/i18n";

/**
 * Rappel du jour : sélectionne automatiquement un rappel islamique différent
 * chaque jour et se met à jour tout seul au passage de minuit.
 */
export function DailyReminder() {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    let current = dayIndex();
    setReminder(getDailyReminder(new Date(), locale));
    const id = setInterval(() => {
      const now = dayIndex();
      if (now !== current) {
        current = now;
        setReminder(getDailyReminder(new Date(), locale));
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <section>
      <h2 className="text-base font-bold text-primary mb-3">{t("Rappel du jour")}</h2>
      <div className="bg-[#F3E8FF] rounded-2xl p-5 flex items-start gap-3 min-h-[92px]">
        <Quote className="h-5 w-5 text-primary shrink-0 rotate-180" />
        <div className="flex-1">
          {reminder ? (
            <>
              <p className="font-semibold text-sm text-primary">{reminder.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">{reminder.text}</p>
              {reminder.source && (
                <p className="text-xs text-muted-foreground/80 mt-2 italic">{reminder.source}</p>
              )}
            </>
          ) : (
            <div className="space-y-2" aria-hidden>
              <div className="h-3 w-2/3 rounded bg-primary/10" />
              <div className="h-3 w-full rounded bg-primary/10" />
            </div>
          )}
        </div>
        <Heart className="h-5 w-5 text-primary shrink-0 self-center" />
      </div>
    </section>
  );
}
