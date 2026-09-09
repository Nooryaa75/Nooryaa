import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { BODY_TYPES, EDUCATION_LEVELS, OBJECTIVES, RELIGION_OPTIONS, COUNTRIES, CITIES, PROFESSIONS, maxBirthdate, minBirthdate, ageFromBirthdate, isAdult } from "@/lib/profile";
import { ChevronLeft, Camera, Plus, X, User } from "lucide-react";
import { YesNoRadio } from "@/components/YesNoRadio";
import { PersonalityPicker } from "@/components/PersonalityPicker";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { PhotoManager } from "@/components/PhotoManager";
import { SelfieVerification } from "@/components/SelfieVerification";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { SearchPreferences } from "@/components/SearchPreferences";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/compte/profil")({
  head: () => ({ meta: [{ title: "Mon profil — Nooryaa" }] }),
  component: MyProfile,
});

const VALEURS = ["Foi", "Famille", "Respect", "Honnêteté", "Bienveillance", "Générosité", "Patience", "Humour"];

/** Champ encadré façon maquette : petit libellé gris en haut, valeur en dessous */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card px-3.5 py-2.5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {children}
    </div>
  );
}

const inputCls = "h-auto p-0 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium";

function MyProfile() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const [form, setForm] = useState<any>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoState, setAutoState] = useState<"idle" | "saving" | "saved">("idle");
  const lastSaved = useRef<string | null>(null);
  useEffect(() => {
    if (profile && !form) setForm({ ...profile, valeurs: (profile.preferences as any)?.valeurs ?? [] });
  }, [profile, form]);

  /** Construit les données à enregistrer à partir du formulaire. */
  function buildPayload(f: any, opts: { skipInvalidBio?: boolean } = {}) {
    const bio = f.bio || "";
    const bioInvalid = bio.length > 0 && (bio.length < 50 || bio.length > 500);
    if (bioInvalid && !opts.skipInvalidBio) {
      throw new Error("La bio doit contenir entre 50 et 500 caractères");
    }
    const birthdateInvalid = !!f.birthdate && !isAdult(f.birthdate);
    if (birthdateInvalid && !opts.skipInvalidBio) {
      throw new Error("Vous devez avoir au moins 18 ans");
    }
    const payload: any = {
      height_cm: f.height_cm ? Number(f.height_cm) : null,
      body_type: f.body_type || null,
      city: f.city, country: f.country, country_origin: f.country_origin,
      grew_up: f.grew_up || null,
      latitude: f.latitude ?? null, longitude: f.longitude ?? null,
      marital_status: f.marital_status,
      salat_quotidienne: f.salat_quotidienne ?? null,
      ramadan: f.ramadan ?? null,
      hadj: f.hadj ?? null,
      omra: f.omra ?? null,
      porte_voile: profile?.gender === "femme" ? (f.porte_voile ?? null) : null,
      has_children: f.has_children ?? null,
      children_count: f.has_children ? (Number(f.children_count) || null) : null,
      wants_children: f.wants_children ?? null,
      smoker: f.smoker ?? null,
      religion: f.religion,
      looking_for: profile?.gender === "homme" ? "femme" : "homme",
      profession: f.profession, education_level: f.education_level,
      activities: f.activities, objective: f.objective,
      personality: f.personality || null,
      phone: f.phone || null,
      preferences: { ...(f.preferences ?? {}), valeurs: f.valeurs ?? [] },
    };
    // En enregistrement automatique, on ignore simplement les champs invalides
    // au lieu de bloquer toute la sauvegarde.
    if (!bioInvalid) payload.bio = f.bio;
    if (!birthdateInvalid) payload.birthdate = f.birthdate || null;
    return payload;
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(buildPayload(form)).eq("id", ctx.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      lastSaved.current = JSON.stringify(buildPayload(form, { skipInvalidBio: true }));
      toast.success("Profil mis à jour");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "L'enregistrement a échoué.")),
  });

  // Enregistrement automatique au fil de la saisie (1,5 s après la dernière modification).
  useEffect(() => {
    if (!form) return;
    const payload = buildPayload(form, { skipInvalidBio: true });
    const snapshot = JSON.stringify(payload);
    if (lastSaved.current === null) {
      lastSaved.current = snapshot;
      return;
    }
    if (snapshot === lastSaved.current) return;
    const t = setTimeout(async () => {
      setAutoState("saving");
      const { error } = await supabase.from("profiles").update(payload).eq("id", ctx.userId);
      if (error) {
        setAutoState("idle");
        return;
      }
      lastSaved.current = snapshot;
      setAutoState("saved");
      setTimeout(() => setAutoState("idle"), 2000);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);


  if (!form) return <div className="text-center py-12">Chargement...</div>;

  // `activities` est stocké en base sous forme de texte « A, B, C ».
  const activities: string[] = Array.isArray(form.activities)
    ? form.activities
    : String(form.activities ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const valeurs: string[] = Array.isArray(form.valeurs) ? form.valeurs : [];

  const toggleValeur = (v: string) =>
    setForm({ ...form, valeurs: valeurs.includes(v) ? valeurs.filter((x) => x !== v) : [...valeurs, v] });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Mon profil</h1>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="absolute right-0 text-accent font-semibold text-sm"
        >
          {save.isPending ? "…" : "Enregistrer"}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="h-28 w-28 rounded-full overflow-hidden bg-secondary">
            {profile?.primary_photo_url ? (
              <img src={profile.primary_photo_url} alt={profile.pseudo} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <a href="#mes-photos" aria-label="Changer la photo" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2">
            <Camera className="h-4 w-4" />
          </a>
        </div>
        <a href="#mes-photos" className="text-primary text-sm font-semibold">Changer la photo</a>
      </div>

      {/* Informations personnelles */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Informations personnelles</h2>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Pseudo"><Input className={inputCls} value={profile?.pseudo ?? ""} disabled /></Field>
          <Field label="Email"><Input className={inputCls} value={profile?.email ?? ""} disabled /></Field>
          <Field label="Téléphone">
            <Input className={inputCls} type="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" />
          </Field>
          <Field label={`Date de naissance${form.birthdate ? ` — ${ageFromBirthdate(form.birthdate)} ans` : ""}`}>
            <BirthdatePicker
              value={form.birthdate ?? ""}
              onChange={(v) => setForm({ ...form, birthdate: v })}
            />
          </Field>
          <Field label="Taille (cm)">
            <Input className={inputCls} type="number" min={120} max={230} value={form.height_cm ?? ""} onChange={(e) => setForm({ ...form, height_cm: e.target.value ? Number(e.target.value) : null })} placeholder="Ex. 175" />
          </Field>
          <Field label="Corpulence">
            <Select value={form.body_type ?? ""} onValueChange={(v) => setForm({ ...form, body_type: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{BODY_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Ville">
            <CityAutocomplete
              value={form.city ?? ""}
              onChange={(v) => setForm({ ...form, city: v })}
              onCoords={(c) => setForm((f: any) => ({ ...f, latitude: c?.latitude ?? null, longitude: c?.longitude ?? null }))}
              suggestions={CITIES}
              placeholder="Commencez à taper votre ville..."
            />
          </Field>
          <Field label="Pays de résidence">
            <Select value={form.country ?? ""} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Pays d'origine">
            <Select value={form.country_origin ?? ""} onValueChange={(v) => setForm({ ...form, country_origin: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Où as-tu grandi ?">
            <Select value={form.grew_up ?? ""} onValueChange={(v) => setForm({ ...form, grew_up: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Profession">
            <Select value={form.profession ?? ""} onValueChange={(v) => setForm({ ...form, profession: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Niveau d'études">
            <Select value={form.education_level ?? ""} onValueChange={(v) => setForm({ ...form, education_level: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Situation">
            <Select value={form.marital_status ?? ""} onValueChange={(v) => setForm({ ...form, marital_status: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="divorce">Divorcé·e</SelectItem>
                <SelectItem value="veuf">Veuf·ve</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Religion">
            <Select value={form.religion ?? "Islam"} onValueChange={(v) => setForm({ ...form, religion: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue /></SelectTrigger>
              <SelectContent>{RELIGION_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Mon objectif sur Nooryaa">
            <Select value={form.objective ?? ""} onValueChange={(v) => setForm({ ...form, objective: v })}>
              <SelectTrigger className="h-auto p-0 border-0 shadow-none text-sm font-medium"><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="rounded-xl border border-border/70 bg-card px-3.5 py-2.5">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-xs text-muted-foreground">À propos de moi</p>
              <p className="text-xs text-muted-foreground">{(form.bio || "").length}/500</p>
            </div>
            <Textarea
              className="p-0 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium min-h-[80px] resize-none"
              value={form.bio ?? ""}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              maxLength={500}
              placeholder="Parlez de vous… (minimum 50 caractères)"
            />
          </div>
        </div>
      </section>

      {/* Centres d'intérêt */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Centres d'intérêt</h2>
        <div className="flex flex-wrap gap-2">
          {activities.map((a: string) => (
            <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-secondary text-secondary-foreground px-3.5 py-1.5 text-sm font-medium">
              {a}
              <button type="button" aria-label={`Retirer ${a}`} onClick={() => setForm({ ...form, activities: activities.filter((x) => x !== a).join(", ") })}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {activities.length < 3 && (
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 text-primary px-3.5 py-1.5 text-sm font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          )}
        </div>
        {pickerOpen && (
          <div className="bg-card rounded-2xl border border-border/60 p-4">
            <ActivitiesPicker value={form.activities} onChange={(v) => setForm({ ...form, activities: v })} />
          </div>
        )}
      </section>

      {/* Valeurs importantes */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold">Valeurs importantes</h2>
        <div className="flex flex-wrap gap-2">
          {VALEURS.map((v) => {
            const active = valeurs.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleValeur(v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-secondary text-secondary-foreground" : "border border-dashed border-primary/50 text-primary"
                }`}
              >
                {!active && <Plus className="h-3.5 w-3.5" />}
                {v}
                {active && <X className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Vie & pratique */}
      <section className="bg-card rounded-2xl p-5 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
        <h2 className="text-sm font-bold">Vie & pratique</h2>
        <YesNoRadio name="has_children" label="Avez-vous des enfants ?" value={form.has_children} onChange={(v) => setForm({ ...form, has_children: v, children_count: v ? form.children_count : null })} />
        {form.has_children === true && (
          <Select value={form.children_count ? String(form.children_count) : ""} onValueChange={(v) => setForm({ ...form, children_count: v ? Number(v) : null })}>
            <SelectTrigger><SelectValue placeholder="Combien d'enfants ?" /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <YesNoRadio name="wants_children" label="Souhaitez-vous avoir des enfants ?" value={form.wants_children} onChange={(v) => setForm({ ...form, wants_children: v })} />
        <YesNoRadio name="salat" label="Salat quotidienne" value={form.salat_quotidienne} onChange={(v) => setForm({ ...form, salat_quotidienne: v })} />
        <YesNoRadio name="ramadan" label="Ramadan" value={form.ramadan} onChange={(v) => setForm({ ...form, ramadan: v })} />
        <YesNoRadio name="hadj" label="Avez-vous fait le Hadj ?" value={form.hadj} onChange={(v) => setForm({ ...form, hadj: v })} />
        <YesNoRadio name="omra" label="Avez-vous fait la Omra ?" value={form.omra} onChange={(v) => setForm({ ...form, omra: v })} />
        {profile?.gender === "femme" && (
          <YesNoRadio name="voile" label="Portez-vous le voile ?" value={form.porte_voile} onChange={(v) => setForm({ ...form, porte_voile: v })} />
        )}
        <YesNoRadio name="smoker" label="Fumez-vous ?" value={form.smoker} onChange={(v) => setForm({ ...form, smoker: v })} />
        <div>
          <p className="text-sm mb-2">Type de personnalité</p>
          <PersonalityPicker value={form.personality} onChange={(v) => setForm({ ...form, personality: v })} />
        </div>
      </section>

      {/* Photos */}
      <div id="mes-photos" className="bg-card rounded-2xl p-5 border border-border/60 shadow-[var(--shadow-card)]">
        <PhotoManager userId={ctx.userId} />
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-[var(--shadow-card)]">
        <SelfieVerification userId={ctx.userId} />
      </div>

      {/* Recherche */}
      <section className="bg-card rounded-2xl p-5 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
        <h2 className="text-sm font-bold">Ce que je recherche</h2>
        <SearchPreferences
          value={form.preferences}
          onChange={(p) => setForm({ ...form, preferences: p })}
          gender={profile?.gender}
        />
      </section>

      <div className="flex items-center justify-between">
        <Link to="/blocked" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary">
          Voir mes profils bloqués
        </Link>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">Enregistrer</Button>
      </div>
    </div>
  );
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** Sélecteur de date de naissance en trois menus : jour / mois / année. */
function BirthdatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m, d] = value ? value.split("-").map(Number) : [null, null, null] as const;
  const minYear = Number(minBirthdate().slice(0, 4));
  const maxYear = Number(maxBirthdate().slice(0, 4));
  const years: number[] = [];
  for (let yr = maxYear; yr >= minYear; yr--) years.push(yr);
  const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 31;
  const days: number[] = [];
  for (let dd = 1; dd <= daysInMonth; dd++) days.push(dd);

  const emit = (day: number | null, month: number | null, year: number | null) => {
    if (!day || !month || !year) return;
    onChange(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };

  const selCls = "h-auto p-0 border-0 shadow-none text-sm font-medium focus:ring-0";

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={d ? String(d) : ""} onValueChange={(v) => emit(Number(v), m, y)}>
        <SelectTrigger className={selCls}><SelectValue placeholder="Jour" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {days.map((dd) => <SelectItem key={dd} value={String(dd)}>{dd}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={m ? String(m) : ""} onValueChange={(v) => emit(d, Number(v), y)}>
        <SelectTrigger className={selCls}><SelectValue placeholder="Mois" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {MONTHS_FR.map((mo, i) => <SelectItem key={mo} value={String(i + 1)}>{mo}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={y ? String(y) : ""} onValueChange={(v) => emit(d, m, Number(v))}>
        <SelectTrigger className={selCls}><SelectValue placeholder="Année" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {years.map((yr) => <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
