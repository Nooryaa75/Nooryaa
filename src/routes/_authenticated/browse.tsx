import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
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
import { MapPin, Search, User, Trash2, Star, Sparkles, Navigation, Clock } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { SwipeDeck } from "@/components/SwipeDeck";

type DeckKey = "match" | "proches" | "nouveaux";

const DECKS: { key: DeckKey; title: string; desc: string; Icon: typeof Sparkles }[] = [
  { key: "match", title: "Ils/elles te correspondent", desc: "Selon vos critères et vos préférences.", Icon: Sparkles },
  { key: "proches", title: "Près de chez toi", desc: "Les profils les plus proches de votre ville.", Icon: Navigation },
  { key: "nouveaux", title: "Les nouveaux profils", desc: "Les dernières inscriptions sur Nooryaa.", Icon: Clock },
];

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({
    meta: [
      { title: "Découvrir des profils — Nooryaa" },
      { name: "description", content: "Affinez votre recherche, cherchez autour de vous en kilomètres et enregistrez vos recherches favorites." },
      { property: "og:title", content: "Découvrir des profils — Nooryaa" },
      { property: "og:description", content: "Recherche par critères, par distance et recherches enregistrées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Browse,
});

const ANY = "any";

type Filters = {
  ageMin: number; ageMax: number; city: string; country: string; countryOrigin: string;
  profession: string; marital: string; education: string; objective: string; activity: string;
  salat: string; ramadan: string; hadj: string; omra: string; voile: string;
  hasChildren: string; wantsChildren: string; smoker: string;
  radiusEnabled: boolean; radiusKm: number;
  originLabel: string; originLat: number | null; originLng: number | null;
};

const DEFAULT_FILTERS: Filters = {
  ageMin: 18, ageMax: 60, city: "", country: ANY, countryOrigin: ANY,
  profession: ANY, marital: ANY, education: ANY, objective: ANY, activity: ANY,
  salat: ANY, ramadan: ANY, hadj: ANY, omra: ANY, voile: ANY,
  hasChildren: ANY, wantsChildren: ANY, smoker: ANY,
  radiusEnabled: false, radiusKm: 50,
  originLabel: "", originLat: null, originLng: null,
};

/** Distance en km entre deux points (formule de haversine). */
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

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

function Browse() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resultats");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchName, setSearchName] = useState("");
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const tri = (v: string) => (v === ANY ? null : v === "yes");

  const { data: me } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const { data: savedSearches } = useQuery({
    queryKey: ["saved-searches", ctx.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Point de référence : la ville choisie dans le filtre, sinon la position du profil.
  const originLat = filters.originLat ?? (me as any)?.latitude ?? null;
  const originLng = filters.originLng ?? (me as any)?.longitude ?? null;

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["browse", ctx.userId, me?.looking_for, filters, originLat, originLng],
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
      const { data, error } = await q.order("last_active", { ascending: false }).limit(200);
      if (error) throw error;
      let rows = (data ?? []).filter((p) => !excluded.has(p.id));
      if (filters.radiusEnabled && originLat != null && originLng != null) {
        rows = rows
          .map((p) => {
            const lat = (p as any).latitude;
            const lng = (p as any).longitude;
            const d = lat != null && lng != null ? distanceKm(originLat, originLng, lat, lng) : null;
            return { ...p, _distance: d } as any;
          })
          .filter((p: any) => p._distance != null && p._distance <= filters.radiusKm)
          .sort((a: any, b: any) => a._distance - b._distance);
      }
      return rows.slice(0, 80);
    },
  });

  const [deck, setDeck] = useState<DeckKey | null>(null);

  // Les trois sélections proposées avant le mode swipe.
  const decks = useMemo(() => {
    const rows: any[] = profiles ?? [];
    const prefs: any = (me as any)?.preferences ?? {};
    const score = (p: any) => {
      let s = 0;
      if (prefs.city && p.city && String(p.city).toLowerCase().includes(String(prefs.city).toLowerCase())) s += 2;
      if (prefs.country && p.country === prefs.country) s += 1;
      if (prefs.education && p.education_level === prefs.education) s += 1;
      if (prefs.objective && p.objective === prefs.objective) s += 2;
      if (prefs.marital && p.marital_status === prefs.marital) s += 1;
      if (typeof prefs.wantsChildren === "boolean" && p.wants_children === prefs.wantsChildren) s += 1;
      if (typeof prefs.smoker === "boolean" && p.smoker === prefs.smoker) s += 1;
      if (me?.city && p.city === me.city) s += 1;
      if (me?.objective && p.objective === me.objective) s += 1;
      return s;
    };
    const withDistance = rows
      .map((p) => {
        if (typeof p._distance === "number") return p;
        const lat = p.latitude, lng = p.longitude;
        const d = originLat != null && originLng != null && lat != null && lng != null
          ? distanceKm(originLat, originLng, lat, lng) : null;
        return { ...p, _distance: d };
      });
    return {
      match: [...rows].sort((a, b) => score(b) - score(a)),
      proches: withDistance
        .filter((p: any) => p._distance != null)
        .sort((a: any, b: any) => a._distance - b._distance),
      nouveaux: [...rows].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      ),
    } as Record<DeckKey, any[]>;
  }, [profiles, me, originLat, originLng]);



  async function saveCurrentSearch() {
    const name = searchName.trim();
    if (!name) { toast.error("Donnez un nom à votre recherche"); return; }
    const { error } = await supabase.from("saved_searches").insert({
      user_id: ctx.userId, name, filters: filters as any,
    });
    if (error) { toast.error(error.message); return; }
    setSearchName("");
    toast.success("Recherche enregistrée");
    qc.invalidateQueries({ queryKey: ["saved-searches", ctx.userId] });
  }

  async function deleteSearch(id: string) {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["saved-searches", ctx.userId] });
  }

  function applySearch(row: any) {
    setFilters({ ...DEFAULT_FILTERS, ...(row.filters ?? {}) });
    setTab("resultats");
    toast.success(`Recherche « ${row.name} » appliquée`);
  }

  const originMissing = filters.radiusEnabled && (originLat == null || originLng == null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary">Découvrir</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="resultats">Profils</TabsTrigger>
          <TabsTrigger value="filtres">Affiner ma recherche</TabsTrigger>
          <TabsTrigger value="enregistrees">Mes recherches</TabsTrigger>
        </TabsList>

        <TabsContent value="filtres" className="space-y-4">
          <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)] border border-border/60 space-y-5">
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

            <div className="rounded-xl border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Recherche autour de moi</p>
                <Button
                  type="button"
                  size="sm"
                  variant={filters.radiusEnabled ? "default" : "outline"}
                  onClick={() => set({ radiusEnabled: !filters.radiusEnabled })}
                >
                  {filters.radiusEnabled ? "Activée" : "Activer"}
                </Button>
              </div>
              {filters.radiusEnabled && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Point de départ (par défaut : ma ville)</Label>
                    <CityAutocomplete
                      value={filters.originLabel}
                      onChange={(v) => set({ originLabel: v })}
                      onCoords={(c) => set({ originLat: c?.latitude ?? null, originLng: c?.longitude ?? null })}
                      suggestions={CITIES}
                      placeholder={me?.city ?? "Choisir une ville de départ..."}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rayon : {filters.radiusKm} km</Label>
                    <Slider
                      value={[filters.radiusKm]}
                      min={5}
                      max={500}
                      step={5}
                      onValueChange={([v]) => set({ radiusKm: v })}
                      className="mt-3"
                    />
                  </div>
                  {originMissing && (
                    <p className="text-xs text-destructive">
                      Aucune position connue : choisissez une ville de départ ci-dessus (ou renseignez votre ville dans votre fiche profil).
                    </p>
                  )}
                </div>
              )}
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

            <div className="flex flex-col sm:flex-row sm:items-end gap-3 border-t border-border/60 pt-4">
              <div className="flex-1">
                <Label className="text-xs">Enregistrer cette recherche sous le nom</Label>
                <Input value={searchName} onChange={(e) => setSearchName(e.target.value)} maxLength={60} placeholder="Ex. Lyon 30 km, pratiquante" />
              </div>
              <Button onClick={saveCurrentSearch}>Enregistrer</Button>
              <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>Réinitialiser</Button>
              <Button variant="secondary" onClick={() => setTab("resultats")}>Voir les profils</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="enregistrees">
          {!savedSearches || savedSearches.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
              <Star className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune recherche enregistrée pour le moment.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {savedSearches.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between gap-3 bg-card rounded-xl border border-border/60 px-4 py-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.filters?.ageMin}–{s.filters?.ageMax} ans
                      {s.filters?.city ? ` · ${s.filters.city}` : ""}
                      {s.filters?.radiusEnabled ? ` · ${s.filters.radiusKm} km` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => applySearch(s)}>Appliquer</Button>
                    <Button size="sm" variant="ghost" aria-label="Supprimer" onClick={() => deleteSearch(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="resultats">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Chargement...</div>
          ) : deck ? (
            <SwipeDeck
              title={DECKS.find((d) => d.key === deck)!.title}
              profiles={decks[deck]}
              userId={ctx.userId}
              onBack={() => setDeck(null)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {DECKS.map(({ key, title, desc, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDeck(key)}
                  className="text-left bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] p-5 hover:shadow-[var(--shadow-soft)] transition-shadow"
                >
                  <Icon className="h-7 w-7 text-[color:var(--gold)]" />
                  <p className="font-serif text-lg text-primary mt-3">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  <p className="text-sm mt-3">{decks[key].length} profil{decks[key].length > 1 ? "s" : ""}</p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
