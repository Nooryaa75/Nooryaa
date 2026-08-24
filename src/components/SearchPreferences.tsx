import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { COUNTRIES, EDUCATION_LEVELS, OBJECTIVES, PROFESSIONS } from "@/lib/profile";

export type Preferences = Record<string, any>;

const ANY = "indifferent";

function TriState({ label, value, onChange }: { label: string; value: any; onChange: (v: any) => void }) {
  const v = value === true ? "true" : value === false ? "false" : ANY;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
      <Label className="text-sm font-normal">{label}</Label>
      <Select value={v} onValueChange={(x) => onChange(x === ANY ? null : x === "true")}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Indifférent</SelectItem>
          <SelectItem value="true">Oui</SelectItem>
          <SelectItem value="false">Non</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OptionalSelect({
  label, value, onChange, options,
}: { label: string; value: any; onChange: (v: string | null) => void; options: readonly string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value ?? ANY} onValueChange={(v) => onChange(v === ANY ? null : v)}>
        <SelectTrigger><SelectValue placeholder="Indifférent" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Indifférent</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SearchPreferences({
  value,
  onChange,
}: {
  value: Preferences | null | undefined;
  onChange: (p: Preferences) => void;
}) {
  const p: Preferences = value ?? {};
  const set = (k: string, v: any) => onChange({ ...p, [k]: v });

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Facultatif — ces critères ne sont pas obligatoires pour valider votre fiche.
      </p>
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="base">
          <AccordionTrigger>Âge et localisation</AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <div>
                <Label>Âge minimum</Label>
                <Input type="number" min={18} max={90} value={p.age_min ?? ""} onChange={(e) => set("age_min", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label>Âge maximum</Label>
                <Input type="number" min={18} max={90} value={p.age_max ?? ""} onChange={(e) => set("age_max", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <Label>Distance maximale (km)</Label>
                <Input type="number" min={1} max={2000} value={p.distance_km ?? ""} onChange={(e) => set("distance_km", e.target.value ? Number(e.target.value) : null)} placeholder="Indifférent" />
              </div>
              <OptionalSelect label="Pays de résidence" value={p.country} onChange={(v) => set("country", v)} options={COUNTRIES} />
              <OptionalSelect label="Pays d'origine" value={p.country_origin} onChange={(v) => set("country_origin", v)} options={COUNTRIES} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="situation">
          <AccordionTrigger>Situation et famille</AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <OptionalSelect label="Situation" value={p.marital_status} onChange={(v) => set("marital_status", v)} options={["Célibataire", "Divorcé·e", "Veuf·ve"]} />
              <div className="md:col-span-2 space-y-2">
                <TriState label="A des enfants" value={p.has_children} onChange={(v) => set("has_children", v)} />
                <TriState label="Souhaite avoir des enfants" value={p.wants_children} onChange={(v) => set("wants_children", v)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pratique">
          <AccordionTrigger>Pratique religieuse</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              <TriState label="Salat quotidienne" value={p.salat_quotidienne} onChange={(v) => set("salat_quotidienne", v)} />
              <TriState label="Ramadan" value={p.ramadan} onChange={(v) => set("ramadan", v)} />
              <TriState label="A fait le Hadj" value={p.hadj} onChange={(v) => set("hadj", v)} />
              <TriState label="A fait la Omra" value={p.omra} onChange={(v) => set("omra", v)} />
              <TriState label="Porte le voile" value={p.porte_voile} onChange={(v) => set("porte_voile", v)} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="parcours">
          <AccordionTrigger>Parcours et objectif</AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <OptionalSelect label="Profession" value={p.profession} onChange={(v) => set("profession", v)} options={PROFESSIONS} />
              <OptionalSelect label="Niveau d'études" value={p.education_level} onChange={(v) => set("education_level", v)} options={EDUCATION_LEVELS} />
              <div className="md:col-span-2">
                <OptionalSelect label="Objectif recherché" value={p.objective} onChange={(v) => set("objective", v)} options={OBJECTIVES} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="mode-de-vie">
          <AccordionTrigger>Mode de vie et centres d'intérêt</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <TriState label="Fumeur·se" value={p.smoker} onChange={(v) => set("smoker", v)} />
              <div>
                <Label>Activités partagées (3 max)</Label>
                <ActivitiesPicker value={p.activities} onChange={(v) => set("activities", v)} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
