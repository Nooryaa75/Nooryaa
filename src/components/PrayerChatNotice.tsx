import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Moon, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Timings = Record<string, string>;

const ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

/** Fenêtre (en minutes) après l'appel pendant laquelle on affiche le rappel. */
const WINDOW_MIN = 30;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/**
 * Bandeau discret affiché dans une conversation lorsqu'on vient d'entrer
 * dans l'heure d'une prière (dans les 30 minutes suivant l'appel).
 */
export function PrayerChatNotice() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCoords({ lat: 48.8566, lng: 2.3522 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 48.8566, lng: 2.3522 }),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, []);

  const { data } = useQuery({
    queryKey: ["prayer-times", coords?.lat?.toFixed(2), coords?.lng?.toFixed(2)],
    enabled: !!coords,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${coords!.lat}&longitude=${coords!.lng}&method=2`,
      );
      if (!res.ok) throw new Error("prayer times unavailable");
      const json = await res.json();
      return json?.data?.timings as Timings;
    },
  });

  // Réévalue chaque minute.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const active = ORDER.filter((k) => data[k])
    .map((k) => ({ label: k, time: data[k].slice(0, 5), min: toMinutes(data[k]) }))
    .find((p) => nowMin >= p.min && nowMin < p.min + WINDOW_MIN);

  if (!active) return null;
  const id = `${now.toDateString()}-${active.label}`;
  if (dismissed === id) return null;

  return (
    <div className="mx-4 my-2 flex items-center gap-2 rounded-2xl bg-[#F3E8FF] px-3 py-2">
      <Moon className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-xs text-primary">
        <span className="font-semibold">{t("C'est l'heure de la prière")} — {t(active.label)} ({active.time}).</span>{" "}
        <span className="text-muted-foreground">{t("Prenez une pause, la conversation vous attendra")} 🌙</span>
      </p>
      <button
        type="button"
        aria-label="Masquer le rappel de prière"
        onClick={() => setDismissed(id)}
        className="text-muted-foreground hover:text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
