import { useEffect, useMemo, useRef } from "react";
import { maxBirthdate, minBirthdate } from "@/lib/profile";

const ITEM_H = 44;
const VISIBLE = 5;
const PAD = Math.floor(VISIBLE / 2); // 2 éléments vides au-dessus et en dessous

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

type WheelColumnProps = {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
};

function WheelColumn({ items, selectedIndex, onSelect, ariaLabel }: WheelColumnProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrolling = useRef<number | null>(null);

  // Positionne la colonne sur l'élément sélectionné au montage / changement externe.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: selectedIndex * ITEM_H });
  }, [selectedIndex]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    if (scrolling.current) window.clearTimeout(scrolling.current);
    scrolling.current = window.setTimeout(() => {
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      if (idx !== selectedIndex) onSelect(idx);
    }, 80);
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="no-scrollbar flex-1 overflow-y-auto snap-y snap-mandatory text-center"
      style={{ height: ITEM_H * VISIBLE, scrollbarWidth: "none" }}
    >
      {Array.from({ length: PAD }).map((_, i) => (
        <div key={`pad-top-${i}`} style={{ height: ITEM_H }} />
      ))}
      {items.map((label, i) => (
        <div
          key={label}
          role="option"
          aria-selected={i === selectedIndex}
          onClick={() => {
            ref.current?.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
            onSelect(i);
          }}
          className={`flex cursor-pointer items-center justify-center snap-center transition-colors ${
            i === selectedIndex ? "font-semibold text-primary" : "text-muted-foreground/60"
          }`}
          style={{ height: ITEM_H }}
        >
          {label}
        </div>
      ))}
      {Array.from({ length: PAD }).map((_, i) => (
        <div key={`pad-bottom-${i}`} style={{ height: ITEM_H }} />
      ))}
    </div>
  );
}

/**
 * Sélecteur de date de naissance en « rouleau » (jour / mois / année),
 * limité aux 18–90 ans comme le reste du site.
 */
export function BirthdateWheel({ value, onChange }: {
  value: string; // yyyy-MM-dd ou ""
  onChange: (value: string) => void;
}) {
  const latest = useMemo(() => new Date(maxBirthdate()), []);
  const earliest = useMemo(() => new Date(minBirthdate()), []);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = latest.getFullYear(); y >= earliest.getFullYear(); y--) list.push(y);
    return list;
  }, [latest, earliest]);

  const parsed = value ? new Date(`${value}T12:00:00`) : null;
  // Par défaut : 26 ans (un départ clairement adulte, à faire défiler ensuite).
  const defaultYear = latest.getFullYear() - 8;
  const year = parsed && !isNaN(parsed.getTime()) ? parsed.getFullYear() : defaultYear;
  const month = parsed && !isNaN(parsed.getTime()) ? parsed.getMonth() + 1 : 1;
  const day = parsed && !isNaN(parsed.getTime()) ? parsed.getDate() : 1;

  // Sans date initiale, on enregistre tout de suite la date affichée par la roue.
  useEffect(() => {
    if (!value) {
      onChange(`${defaultYear}-01-01`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDay = daysInMonth(year, month);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  function emit(y: number, m: number, d: number) {
    const clampedDay = Math.min(d, daysInMonth(y, m));
    let candidate = new Date(y, m - 1, clampedDay, 12);
    if (candidate > latest) candidate = latest;
    if (candidate < earliest) candidate = earliest;
    const iso = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}-${String(candidate.getDate()).padStart(2, "0")}`;
    onChange(iso);
  }

  return (
    <div className="relative rounded-xl border border-border bg-card" data-no-translate>
      {/* Bande de sélection centrale */}
      <div
        className="pointer-events-none absolute inset-x-2 rounded-lg border-y-2 border-primary/40 bg-primary/5"
        style={{ top: PAD * ITEM_H, height: ITEM_H }}
      />
      <div className="relative flex px-2">
        <WheelColumn
          ariaLabel="Jour de naissance"
          items={days.map((d) => String(d))}
          selectedIndex={Math.min(day, maxDay) - 1}
          onSelect={(i) => emit(year, month, i + 1)}
        />
        <WheelColumn
          ariaLabel="Mois de naissance"
          items={MONTHS_FR}
          selectedIndex={month - 1}
          onSelect={(i) => emit(year, i + 1, day)}
        />
        <WheelColumn
          ariaLabel="Année de naissance"
          items={years.map((y) => String(y))}
          selectedIndex={years.indexOf(year)}
          onSelect={(i) => emit(years[i], month, day)}
        />
      </div>
    </div>
  );
}
