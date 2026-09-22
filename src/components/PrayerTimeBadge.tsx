import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Timings = Record<string, string>;

const ORDER = [
  { key: "Fajr", label: "Fajr" },
  { key: "Dhuhr", label: "Dhuhr" },
  { key: "Asr", label: "Asr" },
  { key: "Maghrib", label: "Maghrib" },
  { key: "Isha", label: "Isha" },
] as const;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/** Prière en cours = la dernière dont l'heure est passée (sinon Isha de la veille). */
function currentPrayer(timings: Timings) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const list = ORDER.filter((p) => timings[p.key]).map((p) => ({
    ...p,
    time: timings[p.key].slice(0, 5),
    min: toMinutes(timings[p.key]),
  }));
  if (list.length === 0) return null;
  let cur = list[list.length - 1];
  for (const p of list) if (nowMin >= p.min) cur = p;
  const next = list.find((p) => p.min > nowMin) ?? list[0];
  return { cur, next };
}

export function PrayerTimeBadge() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCoords({ lat: 48.8566, lng: 2.3522 }); // Paris par défaut
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

  // Rafraîchit l'affichage chaque minute.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[#F3E8FF] px-3 py-1.5">
        <Moon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">Horaires…</span>
      </div>
    );
  }

  const res = currentPrayer(data);
  if (!res) return null;

  return (
    <div
      data-no-translate
      className="flex items-center gap-2 rounded-full bg-[#F3E8FF] px-3 py-1.5"
      title={`${t("Prochaine")} : ${t(res.next.label)} ${t("à")} ${res.next.time}`}
      aria-label={`${t("Prière en cours")} : ${t(res.cur.label)} ${t("à")} ${res.cur.time}`}
    >
      <Moon className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold text-primary">
        {t(res.cur.label)} {res.cur.time}
      </span>
      <span className="text-[11px] text-muted-foreground">
        → {t(res.next.label)} {res.next.time}
      </span>
    </div>
  );
}
