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
  EDUCATION_LEVELS,
  COUNTRIES,
  CITIES,
  PROFESSIONS,
  OBJECTIVES,
  PERSONALITY_OPTIONS,
  ageFromBirthdate,
  PRACTICE_LABELS,
} from "@/lib/profile";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { Trash2, Star, User, MapPin, Heart, Layers } from "lucide-react";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS, ANY, type Filters } from "@/hooks/useDiscovery";
import { useMyProfile } from "@/lib/match";
import { useLikeGraph, isBlurred } from "@/lib/reveal";

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

function ProfileCard({ profile, userId, liked, onToggleLike }: { profile: any; userId: string; liked: boolean; onToggleLike: (profileId: string, nextLiked: boolean) => void }) {
  const age = ageFromBirthdate(profile.birthdate);
  const distance = typeof profile._distance === "number" ? `${Math.round(profile._distance)} km` : null;
  const { data: me } = useMyProfile(userId);
  const { data: graph } = useLikeGraph(userId);
  const blurred = isBlurred(profile, me, graph);

  async function like(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      const { error } = await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", profile.id);
      if (error) toast.error(error.message);
      else {
        onToggleLike(profile.id, false);
        toast.success(`Vous n'aimez plus ${profile.pseudo}`);
      }
      return;
    }
    const { error } = await supabase.from("likes").insert({ from_user: userId, to_user: profile.id });
    if (error && !error.message.includes("duplicate")) toast.error(error.message);
    else {
      onToggleLike(profile.id, true);
      toast.success(`Vous avez aimé ${profile.pseudo}`);
    }
  }


  return (
    <div className="group bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-soft)] transition-all duration-300">
      <div className="relative aspect-[4/5] bg-secondary">
        {profile.primary_photo_url ? (
          <img
            src={profile.primary_photo_url}
            alt={profile.pseudo}
            className={`w-full h-full object-cover ${blurred ? "blur-md scale-110" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {typeof profile._matchPercent === "number" && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] text-primary font-bold text-xs h-9 w-9 shadow-md border-2 border-background">
              {profile._matchPercent}%
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={like}
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${liked ? "bg-primary border-primary text-primary-foreground" : "bg-background/90 border-border/60 text-muted-foreground hover:text-primary hover:border-primary"}`}
          aria-label={liked ? "Retirer mon like" : "J'aime"}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-lg text-primary truncate">{profile.pseudo}</h3>
          {age != null && <span className="text-sm text-muted-foreground whitespace-nowrap">{age} ans</span>}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {profile.city || profile.country || "—"}
          {distance && <span>· {distance}</span>}
        </div>
        {profile.religious_practice && (
          <p className="text-[10px] uppercase tracking-wider text-[color:var(--gold)]">
            {PRACTICE_LABELS[profile.religious_practice]}
          </p>
        )}
        {profile.bio && <p className="text-sm text-muted-foreground line-clamp-2 break-words [overflow-wrap:anywhere]">{profile.bio}</p>}
        <Link
          to="/profile/$pseudo"
          params={{ pseudo: profile.pseudo }}
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline mt-1"
        >
          Voir la fiche
        </Link>
      </div>
    </div>
  );
}

function Recherche() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const [tab, setTab] = useState("resultats");
  const [view, setView] = useState<"grid" | "swipe">("grid");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchName, setSearchName] = useState("");
  const [activeSearchName, setActiveSearchName] = useState<string | null>(null);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, boolean>>({});
  const set = (patch: Partial<Filters>) => {
    setActiveSearchName(null);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const { me, isLoading, profiles, originLat, originLng } = useDiscovery(ctx.userId, filters);

  const { data: sentLikes } = useQuery({
    queryKey: ["sent-likes", ctx.userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("to_user").eq("from_user", ctx.userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const likedIds = new Set(
    (sentLikes ?? []).map((row) => row.to_user).filter((id) => optimisticLikes[id] !== false),
  );
  for (const [id, v] of Object.entries(optimisticLikes)) if (v) likedIds.add(id);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary">Recherche</h1>
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
                <Label className="text-xs">Taille min (cm)</Label>
                <Input type="number" min={120} max={230} value={filters.heightMin ?? ""} onChange={(e) => set({ heightMin: e.target.value ? Number(e.target.value) : null })} placeholder="Indifférent" />
              </div>
              <div>
                <Label className="text-xs">Taille max (cm)</Label>
                <Input type="number" min={120} max={230} value={filters.heightMax ?? ""} onChange={(e) => set({ heightMax: e.target.value ? Number(e.target.value) : null })} placeholder="Indifférent" />
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
                <Label className="text-xs">Type de personnalité</Label>
                <Select value={filters.personality} onValueChange={(v) => set({ personality: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Indifférent</SelectItem>
                    {PERSONALITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Label className="text-xs">Activités / centres d'intérêt</Label>
                <ActivitiesPicker value={filters.activities} onChange={(v) => set({ activities: v })} />
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
              <Button variant="outline" onClick={() => { setFilters(DEFAULT_FILTERS); setActiveSearchName(null); }}>Réinitialiser</Button>
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
          ) : !profiles || profiles.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
              <User className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Aucun profil ne correspond à vos critères.</p>
              <Button className="mt-4" variant="outline" onClick={() => setTab("filtres")}>Modifier les filtres</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-muted-foreground">{profiles.length} profil{profiles.length > 1 ? "s" : ""} trouvé{profiles.length > 1 ? "s" : ""}</p>
                <div className="flex items-center gap-2">
                  {activeSearchName && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--gold)]/10 text-[color:var(--gold)] text-xs font-medium border border-[color:var(--gold)]/20">
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
                  )}
                  <Button size="sm" variant={view === "swipe" ? "default" : "outline"} onClick={() => setView(view === "swipe" ? "grid" : "swipe")}>
                    <Layers className="h-4 w-4 mr-1" /> {view === "swipe" ? "Vue grille" : "Mode swipe"}
                  </Button>
                </div>
              </div>
              {view === "swipe" ? (
                <SwipeDeck
                  title="Résultats de recherche"
                  profiles={profiles}
                  userId={ctx.userId}
                  onBack={() => setView("grid")}
                  persistPass={false}
                  hideHeader
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {profiles.map((p) => (
                    <ProfileCard
                      key={p.id}
                      profile={p}
                      userId={ctx.userId}
                      liked={likedIds.has(p.id)}
                      onToggleLike={(profileId, nextLiked) => {
                        setOptimisticLikes((m) => ({ ...m, [profileId]: nextLiked }));
                        qc.invalidateQueries({ queryKey: ["sent-likes", ctx.userId] });
                        qc.invalidateQueries({ queryKey: ["like-graph", ctx.userId] });
                        qc.invalidateQueries({ queryKey: ["unread-counts"] });
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
