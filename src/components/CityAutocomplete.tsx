import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions: readonly string[];
}

export function CityAutocomplete({ value, onChange, placeholder, suggestions }: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

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

  const filtered = input
    ? suggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div ref={ref} className="relative">
      <Input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(e) => {
          setInput(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {filtered.map((s) => (
            <li
              key={s}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-primary/10"
              onClick={() => {
                setInput(s);
                onChange(s);
                setOpen(false);
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
