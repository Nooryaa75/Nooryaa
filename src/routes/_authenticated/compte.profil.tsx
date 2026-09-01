import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
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
  useEffect(() => {
    if (profile && !form) setForm({ ...profile, valeurs: (profile.preferences as any)?.valeurs ?? [] });
  }, [profile, form]);

  const save = useMutation({
    mutationFn: async () => {
      const bio = form.bio || "";
      if (bio.length > 0 && (bio.length < 50 || bio.length > 500)) {
        throw new Error("La bio doit contenir entre 50 et 500 caractères");
      }
      if (form.birthdate && !isAdult(form.birthdate)) {
        throw new Error("Vous devez avoir au moins 18 ans");
      }
      const { error } = await supabase.from("profiles").update({
        birthdate: form.birthdate || null,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        body_type: form.body_type || null,
        city: form.city, country: form.country, country_origin: form.country_origin,
        grew_up: form.grew_up || null,
        latitude: form.latitude ?? null, longitude: form.longitude ?? null,
        marital_status: form.marital_status,
        salat_quotidienne: form.salat_quotidienne ?? null,
        ramadan: form.ramadan ?? null,
        hadj: form.hadj ?? null,
        omra: form.omra ?? null,
        porte_voile: profile?.gender === "femme" ? (form.porte_voile ?? null) : null,
        has_children: form.has_children ?? null,
        children_count: form.has_children ? (Number(form.children_count) || null) : null,
        wants_children: form.wants_children ?? null,
        smoker: form.smoker ?? null,
        religion: form.religion,
        looking_for: profile?.gender === "homme" ? "femme" : "homme",
        bio: form.bio,
        profession: form.profession, education_level: form.education_level,
        activities: form.activities, objective: form.objective,
        personality: form.personality || null,
        phone: form.phone || null,
        preferences: { ...(form.preferences ?? {}), valeurs: form.valeurs ?? [] },
      }).eq("id", ctx.userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil mis à jour"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: any) => toast.error(e.message),
  });

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
          <Field label={`Âge${form.birthdate ? ` — ${ageFromBirthdate(form.birthdate)} ans` : ""}`}>
            <Input
              className={inputCls}
              type="date"
              value={form.birthdate ?? ""}
              min={minBirthdate()}
              max={maxBirthdate()}
              onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
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
