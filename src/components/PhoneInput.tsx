import { useEffect, useMemo, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  AsYouType,
  getExampleNumber,
  type CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { Input } from "@/components/ui/input";

const regionNames = (() => {
  try { return new Intl.DisplayNames(["fr"], { type: "region" }); } catch { return null; }
})();

const flag = (cc: string) =>
  cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const COUNTRIES = getCountries()
  .map((c) => ({ code: c, name: regionNames?.of(c) ?? c, dial: getCountryCallingCode(c) }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

/** Vrai si le numéro (format international +XX…) respecte les règles du pays. */
export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const p = parsePhoneNumberFromString(value);
  return !!p && p.isValid();
}

function splitValue(value: string): { country: CountryCode; national: string } {
  const p = value ? parsePhoneNumberFromString(value.startsWith("+") ? value : value, "FR") : undefined;
  if (p?.country) return { country: p.country, national: p.formatNational() };
  return { country: "FR", national: value.startsWith("+") ? "" : value };
}

type Props = {
  id?: string;
  value: string;
  onChange: (e164: string) => void;
  readOnly?: boolean;
  className?: string;
  required?: boolean;
};

/** Champ téléphone : choix du pays (indicatif) + numéro vérifié selon les règles du pays. Renvoie le format +33612345678. */
export function PhoneInput({ id, value, onChange, readOnly, className, required }: Props) {
  const init = useMemo(() => splitValue(value || ""), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<CountryCode>(init.country);
  const [national, setNational] = useState(init.national);

  useEffect(() => {
    // synchronise si la valeur arrive plus tard (chargement du profil)
    if (value && value !== toE164(country, national)) {
      const s = splitValue(value);
      setCountry(s.country);
      setNational(s.national);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (c: CountryCode, n: string) => onChange(toE164(c, n));

  const example = useMemo(() => {
    try { return getExampleNumber(country, examples as any)?.formatNational() ?? ""; } catch { return ""; }
  }, [country]);

  const valid = national ? isValidPhone(toE164(country, national)) : true;

  return (
    <div>
      <div className="flex gap-2">
        <select
          aria-label="Pays"
          disabled={readOnly}
          value={country}
          onChange={(e) => { const c = e.target.value as CountryCode; setCountry(c); emit(c, national); }}
          className="h-10 max-w-[45%] rounded-md border border-input bg-background px-2 text-sm"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{flag(c.code)} {c.name} (+{c.dial})</option>
          ))}
        </select>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          required={required}
          readOnly={readOnly}
          value={national}
          placeholder={example}
          onChange={(e) => {
            const n = new AsYouType(country).input(e.target.value);
            setNational(n);
            emit(country, n);
          }}
          className={className}
        />
      </div>
      {!valid && (
        <p className="mt-1 text-[11px] text-destructive">
          Numéro invalide pour ce pays{example ? ` (ex. ${example})` : ""}.
        </p>
      )}
    </div>
  );
}

function toE164(c: CountryCode, n: string): string {
  if (!n.trim()) return "";
  const p = parsePhoneNumberFromString(n, c);
  return p ? p.number : `+${getCountryCallingCode(c)}${n.replace(/\D/g, "").replace(/^0/, "")}`;
}
