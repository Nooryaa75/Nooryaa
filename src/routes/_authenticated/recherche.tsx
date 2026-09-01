import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  EDUCATION_LEVELS,
  COUNTRIES,
  CITIES,
  BODY_TYPES,
  PROFESSIONS,
  OBJECTIVES,
  PERSONALITY_OPTIONS,
} from "@/lib/profile";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import {
  Trash2, Star, Heart, Home, Bell, Search, MapPin, Crosshair,
  MoreVertical, Plus, RotateCcw, ChevronLeft,
} from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS, ANY, type Filters } from "@/hooks/useDiscovery";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/recherche")({
  head: () => ({
    meta: [
      { title: "Recherche de profils — Nooryaa" },
      { name: "description", content: "Affinez votre recherche, cherchez autour de vous en kilomètres et enregistrez vos recherches favorites." },
      { property: "og:title", content: "Recherche de profils — Nooryaa" },
      { property: "og:description", content: "Recherche par critères, par distance et recherches enregistrées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recherche,
});

const TABS = [
  { key: "resultats", label: "Profils" },
  { key: "filtres", label: "Affiner ma recherche" },
  { key: "enregistrees", label: "Mes recherches" },
] as const;

/** Petit libellé de section façon maquette. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-primary">{children}</p>;
}

/** Pilule sélectionnable Homme / Femme. */
function GenderPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {["Homme", "Femme"].map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
            value === g
              ? "text-white shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
          }`}
          style={value === g ? { background: "var(--gradient-gold)" } : undefined}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

/** Filtre tri-état oui / non / indifférent, reprend les questions de la fiche profil. */
function TriFilter({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Indifférent</SelectItem>
          <SelectItem value="yes">Oui</SelectItem>
          <SelectItem value="no">Non</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

const SEARCH_ICONS = [Heart, Star, Home];

function Recherche() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resultats");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchName, setSearchName] = useState("");
  const [activeSearchName, setActiveSearchName] = useState<string | null>(null);
  const set = (patch: Partial<Filters>) => {
    setActiveSearchName(null);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const { me, isLoading, profiles, originLat, originLng } = useDiscovery(ctx.userId, filters);

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
    setActiveSearchName(row.name ?? null);
    setTab("resultats");
    toast.success(`Recherche « ${row.name} » appliquée`);
  }

  const originMissing = filters.radiusEnabled && (originLat == null || originLng == null);
  const myGenderLabel = me?.gender === "femme" ? "Femme" : "Homme";
  const seekingLabel = me?.gender === "femme" ? "Homme" : "Femme";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        {tab !== "resultats" && (
          <button
            type="button"
            onClick={() => setTab("resultats")}
            aria-label="Retour aux profils"
            className="text-primary hover:text-accent transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <h1 className={`text-2xl font-bold text-primary ${tab !== "resultats" ? "flex-1 text-center pr-6" : ""}`}>
          Recherche
        </h1>
      </div>

      {/* Onglets en pilules */}
      <div className="flex rounded-full bg-secondary p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-0 rounded-full px-1.5 py-2 text-xs font-semibold transition-all whitespace-nowrap truncate sm:px-3 sm:text-sm ${
              tab === t.key
                ? "text-white shadow-md"
                : "text-secondary-foreground hover:text-primary"
            }`}
            style={tab === t.key ? { background: "var(--gradient-gold)" } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== Onglet Profils ===== */}
      {tab === "resultats" && (
        <div className="bg-card rounded-3xl border border-border/60 shadow-[var(--shadow-card)] p-5">
          {activeSearchName && (
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                Recherche : {activeSearchName}
                <button
                  type="button"
                  onClick={() => { setFilters(DEFAULT_FILTERS); setActiveSearchName(null); }}
                  className="hover:text-primary transition-colors"
                  aria-label="Effacer la recherche"
                >
                  ×
                </button>
              </span>
            </div>
          )}
          {isLoading ? (
            <div className="text-center text-muted-foreground py-12">Chargement...</div>
          ) : !profiles || profiles.length === 0 ? (
            <div className="text-center py-14 px-4">
              <div className="relative mx-auto h-20 w-20 mb-5">
                <span className="absolute inset-0 rounded-full bg-accent/10" />
                <Search className="absolute inset-0 m-auto h-9 w-9 text-primary" />
                <Heart className="absolute -top-1 -left-2 h-3 w-3 text-accent fill-current" />
                <Heart className="absolute top-2 -right-3 h-4 w-4 text-accent fill-current" />
                <Heart className="absolute -bottom-1 -left-4 h-3.5 w-3.5 text-accent/60 fill-current" />
                <Heart className="absolute -bottom-2 -right-2 h-2.5 w-2.5 text-accent/60 fill-current" />
              </div>
              <p className="font-bold text-lg text-foreground">Aucun profil ne correspond<br />à vos critères.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Essayez de modifier vos filtres<br />ou élargissez votre recherche.
              </p>
              <Button
                className="mt-6 rounded-full px-8 h-11 text-white border-0"
                style={{ background: "var(--gradient-gold)" }}
                onClick={() => setTab("filtres")}
              >
                Modifier les filtres
              </Button>
            </div>
          ) : (
            <SwipeDeck
              title="Résultats de recherche"
              profiles={profiles}
              userId={ctx.userId}
              onBack={() => setTab("filtres")}
              persistPass
              hideHeader
            />
          )}
        </div>
      )}

      {/* ===== Onglet Affiner ma recherche ===== */}
      {tab === "filtres" && (
        <div className="space-y-6">
          {/* Je recherche */}
          <div className="space-y-3">
            <SectionTitle>Je recherche</SectionTitle>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Je suis</p>
              <GenderPills value={myGenderLabel} onChange={() => {}} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Je recherche</p>
              <GenderPills value={seekingLabel} onChange={() => {}} />
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-3">
            <SectionTitle>Localisation</SectionTitle>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10 pointer-events-none" />
              <CityAutocomplete
                value={filters.originLabel || filters.city}
                onChange={(v) => set(filters.radiusEnabled ? { originLabel: v } : { city: v })}
                onCoords={(c) => set({ originLat: c?.latitude ?? null, originLng: c?.longitude ?? null })}
                suggestions={CITIES}
                placeholder={me?.city ?? "Paris, France"}
              />
              <button
                type="button"
                aria-label="Autour de ma position"
                onClick={() => set({ radiusEnabled: !filters.radiusEnabled })}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${filters.radiusEnabled ? "text-accent" : "text-primary hover:text-accent"}`}
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rayon</span>
                <span className="font-medium">{filters.radiusEnabled ? `${filters.radiusKm} km` : "Désactivé"}</span>
              </div>
              <Slider
                value={[filters.radiusKm]}
                min={5}
                max={500}
                step={5}
                disabled={!filters.radiusEnabled}
                onValueChange={([v]) => set({ radiusKm: v, radiusEnabled: true })}
                className="mt-3"
              />
              {originMissing && (
                <p className="text-xs text-destructive mt-2">
                  Aucune position connue : choisissez une ville ci-dessus (ou renseignez votre ville dans votre fiche profil).
                </p>
              )}
            </div>
          </div>

          {/* Âge */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <SectionTitle>Âge</SectionTitle>
              <span className="text-sm font-medium">{filters.ageMin} - {filters.ageMax} ans</span>
            </div>
            <Slider
              value={[filters.ageMin, filters.ageMax]}
              min={18}
              max={90}
              step={1}
              onValueChange={([a, b]) => set({ ageMin: a, ageMax: b })}
              className="mt-2"
            />
          </div>

          {/* Taille & corpulence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Taille min (cm)</Label>
              <Input className="rounded-xl" type="number" min={120} max={230} value={filters.heightMin ?? ""} onChange={(e) => set({ heightMin: e.target.value ? Number(e.target.value) : null })} placeholder="Indifférent" />
            </div>
            <div>
              <Label className="text-xs">Taille max (cm)</Label>
              <Input className="rounded-xl" type="number" min={120} max={230} value={filters.heightMax ?? ""} onChange={(e) => set({ heightMax: e.target.value ? Number(e.target.value) : null })} placeholder="Indifférent" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Corpulence</Label>
              <Select value={filters.bodyType} onValueChange={(v) => set({ bodyType: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Indifférent</SelectItem>
                  {BODY_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Religion & pratique */}
          <div className="space-y-3">
            <SectionTitle>Pratique religieuse</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TriFilter label="Salat quotidienne" value={filters.salat} onChange={(v) => set({ salat: v })} />
              <TriFilter label="Ramadan" value={filters.ramadan} onChange={(v) => set({ ramadan: v })} />
              <TriFilter label="A fait le Hadj" value={filters.hadj} onChange={(v) => set({ hadj: v })} />
              <TriFilter label="A fait la Omra" value={filters.omra} onChange={(v) => set({ omra: v })} />
              {me?.gender === "homme" && (
                <TriFilter label="Porte le voile" value={filters.voile} onChange={(v) => set({ voile: v })} />
              )}
            </div>
          </div>

          {/* Situation & parcours */}
          <div className="space-y-3">
            <SectionTitle>Situation & parcours</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Situation</Label>
                <Select value={filters.marital} onValueChange={(v) => set({ marital: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Toutes</SelectItem>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="divorce">Divorcé·e</SelectItem>
                    <SelectItem value="veuf">Veuf·ve</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pays de résidence</Label>
                <Select value={filters.country} onValueChange={(v) => set({ country: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Tous</SelectItem>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Pays d'origine</Label>
                <Select value={filters.countryOrigin} onValueChange={(v) => set({ countryOrigin: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Tous</SelectItem>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Profession</Label>
                <Select value={filters.profession} onValueChange={(v) => set({ profession: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Toutes</SelectItem>
                    {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Niveau d'études</Label>
                <Select value={filters.education} onValueChange={(v) => set({ education: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Tous</SelectItem>
                    {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Objectif sur Nooryaa</Label>
                <Select value={filters.objective} onValueChange={(v) => set({ objective: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Tous</SelectItem>
                    {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Type de personnalité</Label>
                <Select value={filters.personality} onValueChange={(v) => set({ personality: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Indifférent</SelectItem>
                    {PERSONALITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enfants & mode de vie */}
          <div className="space-y-3">
            <SectionTitle>Enfants & mode de vie</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <TriFilter label="A des enfants" value={filters.hasChildren} onChange={(v) => set({ hasChildren: v })} />
              <TriFilter label="Souhaite des enfants" value={filters.wantsChildren} onChange={(v) => set({ wantsChildren: v })} />
              <TriFilter label="Fumeur·se" value={filters.smoker} onChange={(v) => set({ smoker: v })} />
            </div>
            <div>
              <Label className="text-xs">Activités / centres d'intérêt</Label>
              <ActivitiesPicker value={filters.activities} onChange={(v) => set({ activities: v })} />
            </div>
          </div>

          {/* Enregistrer la recherche */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs">Nom de la recherche</Label>
              <Input className="rounded-xl" value={searchName} onChange={(e) => setSearchName(e.target.value)} maxLength={60} placeholder="Ex. Sérieux & compatible" />
            </div>
            <Button variant="outline" className="rounded-full" onClick={saveCurrentSearch}>Enregistrer</Button>
          </div>

          {/* Actions principales */}
          <Button
            className="w-full rounded-full h-12 text-base font-semibold text-white border-0 shadow-lg"
            style={{ background: "var(--gradient-gold)" }}
            onClick={() => setTab("resultats")}
          >
            Voir les résultats{profiles ? ` (${profiles.length})` : ""}
          </Button>
          <button
            type="button"
            onClick={() => { setFilters(DEFAULT_FILTERS); setActiveSearchName(null); }}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* ===== Onglet Mes recherches ===== */}
      {tab === "enregistrees" && (
        <div className="space-y-5">
          <div>
            <SectionTitle>Mes recherches sauvegardées</SectionTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Retrouvez vos recherches et soyez notifié<br />lorsque de nouveaux profils correspondent.
            </p>
          </div>

          {!savedSearches || savedSearches.length === 0 ? (
            <div className="text-center py-14 bg-card rounded-3xl border border-border/60">
              <Star className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucune recherche enregistrée pour le moment.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {savedSearches.map((s: any, i: number) => {
                const Icon = SEARCH_ICONS[i % SEARCH_ICONS.length];
                return (
                  <li key={s.id} className="flex items-center gap-4 bg-card rounded-3xl border border-border/60 shadow-[var(--shadow-card)] px-5 py-4">
                    <span className="h-12 w-12 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-accent" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.filters?.ageMin}–{s.filters?.ageMax} ans
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.filters?.city || s.filters?.originLabel || "Partout"}
                        {s.filters?.radiusEnabled ? ` • Rayon ${s.filters.radiusKm} km` : ""}
                      </p>
                    </div>
                    <button type="button" aria-label="Notifications" className="text-accent hover:text-primary transition-colors">
                      <Bell className="h-5 w-5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label="Options" className="text-muted-foreground hover:text-primary transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => applySearch(s)}>Appliquer</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteSearch(s.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setTab("filtres")}
            className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-accent/40 text-accent font-semibold py-3.5 hover:bg-accent/5 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Créer une nouvelle recherche
          </button>
        </div>
      )}
    </div>
  );
}
