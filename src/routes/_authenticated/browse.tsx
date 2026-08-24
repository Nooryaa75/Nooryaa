import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ageFromBirthdate,
  PRACTICE_LABELS,
  EDUCATION_LEVELS,
  COUNTRIES,
  CITIES,
  PROFESSIONS,
  OBJECTIVES,
  ACTIVITIES_OPTIONS,
} from "@/lib/profile";
import { MapPin, Search, User } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";

const ANY = "any";

/** Filtre tri-état oui / non / indifférent, reprend les questions de la fiche profil. */
function TriFilter({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Indifférent</SelectItem>
          <SelectItem value="yes">Oui</SelectItem>
          <SelectItem value="no">Non</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Découvrir — Nooryaa" }] }),
  component: Browse,
});

function Browse() {
  const ctx = Route.useRouteContext();
  const initialFilters = {
    ageMin: 18, ageMax: 60, city: "", country: ANY, countryOrigin: ANY,
    profession: ANY, marital: ANY, education: ANY, objective: ANY, activity: ANY,
    salat: ANY, ramadan: ANY, hadj: ANY, omra: ANY, voile: ANY,
    hasChildren: ANY, wantsChildren: ANY, smoker: ANY,
  };
  const [filters, setFilters] = useState(initialFilters);
  const set = (patch: Partial<typeof initialFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const tri = (v: string) => (v === ANY ? null : v === "yes");

  const { data: me } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["browse", ctx.userId, me?.looking_for, filters],
    enabled: !!me,
    queryFn: async () => {
      // Récupère les blocages dans les deux sens pour les exclure
      const [{ data: iBlock }, { data: blockedMe }] = await Promise.all([
        supabase.from("blocks").select("blocked").eq("blocker", ctx.userId),
        supabase.from("blocks").select("blocker").eq("blocked", ctx.userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
      ]);
      const today = new Date();
      const maxBirth = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      const minBirth = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      let q = supabase.from("profiles").select("*").eq("onboarded", true).eq("status", "active").neq("id", ctx.userId);
      // Femme voit uniquement les hommes, homme voit uniquement les femmes
      if (me?.gender === "homme") q = q.eq("gender", "femme");
      else if (me?.gender === "femme") q = q.eq("gender", "homme");
      q = q.gte("birthdate", minBirth).lte("birthdate", maxBirth);
      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.country !== ANY) q = q.eq("country", filters.country);
      if (filters.countryOrigin !== ANY) q = q.eq("country_origin", filters.countryOrigin);
      if (filters.profession !== ANY) q = q.eq("profession", filters.profession);
      if (filters.marital !== ANY) q = q.eq("marital_status", filters.marital as any);
      if (filters.education !== ANY) q = q.eq("education_level", filters.education);
      if (filters.objective !== ANY) q = q.eq("objective", filters.objective);
      if (filters.activity !== ANY) q = q.ilike("activities", `%${filters.activity}%`);
      for (const [col, val] of [
        ["salat_quotidienne", filters.salat],
        ["ramadan", filters.ramadan],
        ["hadj", filters.hadj],
        ["omra", filters.omra],
        ["porte_voile", filters.voile],
        ["has_children", filters.hasChildren],
        ["wants_children", filters.wantsChildren],
        ["smoker", filters.smoker],
      ] as const) {
        const b = tri(val);
        if (b !== null) q = q.eq(col, b);
      }
      const { data, error } = await q.order("last_active", { ascending: false }).limit(80);
      if (error) throw error;
      return (data ?? []).filter((p) => !excluded.has(p.id));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary">Découvrir</h1>
        <p className="text-muted-foreground text-sm">Affinez votre recherche. Nooryaa est Abonnement gratuit.</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)] border border-border/60 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Âge min</Label>
            <Input type="number" min={18} max={99} value={filters.ageMin} onChange={(e) => set({ ageMin: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Âge max</Label>
            <Input type="number" min={18} max={99} value={filters.ageMax} onChange={(e) => set({ ageMax: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Ville / région</Label>
            <CityAutocomplete value={filters.city} onChange={(v) => set({ city: v })} suggestions={CITIES} placeholder="Commencez à taper une ville..." />
          </div>
          <div>
            <Label className="text-xs">Pays de résidence</Label>
            <Select value={filters.country} onValueChange={(v) => set({ country: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Tous</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Pays d'origine</Label>
            <Select value={filters.countryOrigin} onValueChange={(v) => set({ countryOrigin: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Tous</SelectItem>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Profession</Label>
            <Select value={filters.profession} onValueChange={(v) => set({ profession: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Toutes</SelectItem>
                {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Situation</Label>
            <Select value={filters.marital} onValueChange={(v) => set({ marital: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Toutes</SelectItem>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="divorce">Divorcé·e</SelectItem>
                <SelectItem value="veuf">Veuf·ve</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Niveau d'études</Label>
            <Select value={filters.education} onValueChange={(v) => set({ education: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Tous</SelectItem>
                {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Objectif sur Nooryaa</Label>
            <Select value={filters.objective} onValueChange={(v) => set({ objective: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Tous</SelectItem>
                {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Activité / centre d'intérêt</Label>
            <Select value={filters.activity} onValueChange={(v) => set({ activity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Toutes</SelectItem>
                {ACTIVITIES_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Pratique religieuse</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TriFilter label="Salat quotidienne" value={filters.salat} onChange={(v) => set({ salat: v })} />
            <TriFilter label="Ramadan" value={filters.ramadan} onChange={(v) => set({ ramadan: v })} />
            <TriFilter label="A fait le Hadj" value={filters.hadj} onChange={(v) => set({ hadj: v })} />
            <TriFilter label="A fait la Omra" value={filters.omra} onChange={(v) => set({ omra: v })} />
            {me?.gender === "homme" && (
              <TriFilter label="Porte le voile" value={filters.voile} onChange={(v) => set({ voile: v })} />
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Enfants & mode de vie</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TriFilter label="A des enfants" value={filters.hasChildren} onChange={(v) => set({ hasChildren: v })} />
            <TriFilter label="Souhaite des enfants" value={filters.wantsChildren} onChange={(v) => set({ wantsChildren: v })} />
            <TriFilter label="Fumeur·se" value={filters.smoker} onChange={(v) => set({ smoker: v })} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setFilters(initialFilters)}>Réinitialiser les filtres</Button>
        </div>
      </div>


      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Chargement...</div>
      ) : !profiles || profiles.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun profil ne correspond à vos critères pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {profiles.map((p) => (
            <Link
              key={p.id}
              to="/profile/$pseudo"
              params={{ pseudo: p.pseudo }}
              className="group bg-card rounded-2xl overflow-hidden border border-border/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow"
            >
              <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                {p.primary_photo_url ? (
                  <img src={p.primary_photo_url} alt={p.pseudo} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${(p as any).primary_photo_blurred ? "blur-md scale-110" : ""}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="h-16 w-16 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-primary truncate">{p.pseudo}</span>
                  <span className="text-sm text-muted-foreground">{ageFromBirthdate(p.birthdate)} ans</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{p.city || p.country || "—"}
                </div>
                {p.religious_practice && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-[color:var(--gold)]">
                    {PRACTICE_LABELS[p.religious_practice]}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}