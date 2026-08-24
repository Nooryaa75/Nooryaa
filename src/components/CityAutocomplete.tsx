import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: readonly string[];
  /** Appelé avec les coordonnées de la commune choisie (si disponibles). */
  onCoords?: (coords: { latitude: number; longitude: number } | null) => void;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function CityAutocomplete({ value, onChange, placeholder, suggestions = [] }: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [remote, setRemote] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const skipFetch = useRef(false);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Recherche des communes françaises en direct
  useEffect(() => {
    const q = input.trim();
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    if (q.length < 2) {
      setRemote([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,departement&boost=population&limit=8`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ nom: string; departement?: { nom?: string } }>;
        setRemote(
          data.map((c) => (c.departement?.nom ? `${c.nom} (${c.departement.nom})` : c.nom)),
        );
      } catch {
        /* ignore */
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [input]);

  const local = input
    ? suggestions.filter((s) => norm(s).includes(norm(input)))
    : suggestions.slice(0, 8);

  const filtered = Array.from(new Set([...remote, ...local])).slice(0, 8);

  const select = (s: string) => {
    skipFetch.current = true;
    setInput(s);
    onChange(s);
    setRemote([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        type="text"
        value={input}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {filtered.map((s) => (
            <li
              key={s}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
              onMouseDown={(e) => {
                e.preventDefault();
                select(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
