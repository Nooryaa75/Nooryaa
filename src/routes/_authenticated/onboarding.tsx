import { PhoneInput, isValidPhone } from "@/components/PhoneInput";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BODY_TYPES, EDUCATION_LEVELS, OBJECTIVES, RELIGION_OPTIONS, COUNTRIES, CITIES, PROFESSIONS, maxBirthdate, minBirthdate, isAdult } from "@/lib/profile";
import { YesNoRadio } from "@/components/YesNoRadio";
import { PersonalityPicker } from "@/components/PersonalityPicker";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { PhotoManager } from "@/components/PhotoManager";
import { SelfieVerification } from "@/components/SelfieVerification";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { frenchError } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Compléter mon profil — Nooryaa" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const ctx = Route.useRouteContext();
  const { t } = useI18n();
  const [lockedPhone, setLockedPhone] = useState(false);
  const [form, setForm] = useState({
    pseudo: "",
    firstName: "",
    lastName: "",
    gender: "" as "homme" | "femme" | "",
    birthdate: "",
    height_cm: "",
    body_type: "",
    phone: "",
    city: "",
    country: "France",
    country_origin: "",
    grew_up: "",
    marital_status: "" as "celibataire" | "divorce" | "veuf" | "",
    salat_quotidienne: null as boolean | null,
    ramadan: null as boolean | null,
    hadj: null as boolean | null,
    omra: null as boolean | null,
    porte_voile: null as boolean | null,
    has_children: null as boolean | null,
    children_count: "",
    wants_children: null as boolean | null,
    smoker: null as boolean | null,
    religion: "Islam (sunnite)",
    profession: "",
    education_level: "",
    activities: "",
    personality: "",
    objective: "",
    bio: "",
    photo_verified: false,
  });
  const [loading, setLoading] = useState(false);
  const [pseudoError, setPseudoError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [extraError, setExtraError] = useState<string | null>(null);
  const errorBoxRef = useRef<HTMLDivElement | null>(null);
  // 20h00 à Paris ce soir (UTC+2 en septembre) = 18h00 UTC
  const SELFIE_REQUIRED_AFTER = useMemo(() => new Date("2026-09-04T18:00:00.000Z"), []);
  const selfieRequired = new Date() >= SELFIE_REQUIRED_AFTER;

  function computeMissing(): string[] {
    const missing: string[] = [];
    if (form.firstName.trim().length < 2) missing.push("Prénom");
    if (form.lastName.trim().length < 2) missing.push("Nom");
    if (!form.pseudo.trim()) missing.push("Pseudo");
    if (!form.gender) missing.push("Je suis");
    if (!form.birthdate) missing.push("Date de naissance");
    if (!form.marital_status) missing.push("Situation");
    if (form.salat_quotidienne === null) missing.push("Salat quotidienne");
    if (form.ramadan === null) missing.push("Ramadan");
    if (form.hadj === null) missing.push("Avez-vous fait le Hadj");
    if (form.omra === null) missing.push("Avez-vous fait la Omra");
    if (form.gender === "femme" && form.porte_voile === null) missing.push("Portez-vous le voile");
    if (form.has_children === null) missing.push("Avez-vous des enfants");
    if (form.has_children === true && !form.children_count) missing.push("Combien d'enfants");
    if (form.wants_children === null) missing.push("Souhaitez-vous avoir des enfants");
    if (!isValidPhone(form.phone)) missing.push("Téléphone (numéro valide)");
    if (!form.city) missing.push("Ville de résidence");
    if (!form.country) missing.push("Pays de résidence");
    if (!form.country_origin) missing.push("Pays d'origine");
    if (!form.profession) missing.push("Profession");
    if (!form.education_level) missing.push("Niveau d'études");
    if (!form.activities) missing.push("Activités / centres d'intérêt");
    if (form.smoker === null) missing.push("Fumez-vous");
    if (!form.objective) missing.push("Mon objectif sur Nooryaa");
    if (form.bio.length < 50 || form.bio.length > 500) missing.push("À propos de vous (50 à 500 caractères)");
    return missing;
  }
  const missingFields = attempted ? computeMissing() : [];

  const [lockedPhone, setLockedPhone] = useState(false);
  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", ctx.userId).maybeSingle().then(({ data }) => {
      if (data && isValidPhone((data as any).phone)) setLockedPhone(true);
      if (data) setForm((f) => ({
        ...f,
        pseudo: data.pseudo && !data.pseudo.startsWith("user_") ? data.pseudo : f.pseudo,
        firstName: (data as any).first_name || f.firstName,
        lastName: (data as any).last_name || f.lastName,
        // Pré-remplissage avec les infos déjà connues (inscription) — on ignore un numéro invalide
        phone: isValidPhone((data as any).phone) ? (data as any).phone : f.phone,
        gender: ((data as any).gender as any) || f.gender,
        birthdate: (data as any).birthdate || f.birthdate,
        city: (data as any).city || f.city,
        country: (data as any).country || f.country,
        country_origin: (data as any).country_origin || f.country_origin,
        photo_verified: !!(data as any).photo_verified,
      }));
    });
  }, [ctx.userId]);

  async function checkPseudo(p: string) {
    if (!p.trim()) {
      setPseudoError("Pseudo requis");
      return false;
    }
    const { data } = await supabase.from("profiles").select("id").eq("pseudo", p).neq("id", ctx.userId).maybeSingle();
    if (data) { setPseudoError("Ce pseudo est déjà pris"); return false; }
    setPseudoError(null);
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!(await checkPseudo(form.pseudo))) {
      errorBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const missing = computeMissing();
    if (missing.length > 0) {
      errorBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!isAdult(form.birthdate)) {
      toast.error("Vous devez avoir au moins 18 ans pour vous inscrire."); return;
    }
    setExtraError(null);
    if (selfieRequired && !form.photo_verified) {
      // La vérification a pu aboutir après le chargement du formulaire : on relit l'état réel.
      const { data: fresh } = await supabase
        .from("profiles").select("photo_verified").eq("id", ctx.userId).maybeSingle();
      if (!(fresh as any)?.photo_verified) {
        setExtraError("Vérification par selfie obligatoire");
        errorBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      setForm((f) => ({ ...f, photo_verified: true }));
    }
    const { count: photoCount } = await supabase.from("photos").select("*", { count: "exact", head: true }).eq("user_id", ctx.userId);
    if (!photoCount || photoCount === 0) {
      setExtraError("Photo de profil (au moins une)");
      errorBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      pseudo: form.pseudo,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      gender: form.gender as any,
      looking_for: form.gender === "homme" ? "femme" : "homme",
      birthdate: form.birthdate,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      body_type: form.body_type || null,
      phone: form.phone || null,
      city: form.city || null,
      latitude: (form as any).latitude ?? null,
      longitude: (form as any).longitude ?? null,
      country: form.country || null,
      country_origin: form.country_origin || null,
      grew_up: form.grew_up || null,
      marital_status: form.marital_status as any,
      salat_quotidienne: form.salat_quotidienne,
      ramadan: form.ramadan,
      hadj: form.hadj,
      omra: form.omra,
      porte_voile: form.gender === "femme" ? form.porte_voile : null,
      has_children: form.has_children,
      children_count: form.has_children ? Number(form.children_count) || null : null,
      wants_children: form.wants_children,
      smoker: form.smoker,
      religion: form.religion || "Islam",
      profession: form.profession || null,
      education_level: form.education_level || null,
      activities: form.activities || null,
      personality: form.personality || null,
      objective: form.objective || null,
      bio: form.bio || null,
      onboarded: true,
    }).eq("id", ctx.userId);
    setLoading(false);
    if (error) { toast.error(frenchError(error, "L'enregistrement a échoué.")); return; }
    toast.success("Profil créé !");
    navigate({ to: "/browse" });
  }

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 md:p-8 shadow-[var(--shadow-card)] border border-border/60">
      <h1 className="text-3xl font-serif text-primary mb-1">Votre profil Nooryaa</h1>
      <p className="text-muted-foreground text-sm mb-6">Tous les champs sont obligatoires pour finaliser votre profil.</p>
      {(missingFields.length > 0 || extraError || (attempted && pseudoError)) && (
        <div ref={errorBoxRef} className="mb-5 rounded-xl border border-destructive/50 bg-destructive/10 p-4" role="alert">
          <p className="font-semibold text-destructive text-sm">Champs obligatoires à compléter :</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-destructive space-y-0.5">
            {pseudoError && attempted && <li>Pseudo : {pseudoError}</li>}
            {missingFields.map((m) => <li key={m}>{m}</li>)}
            {extraError && missingFields.length === 0 && <li>{extraError}</li>}
          </ul>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" maxLength={60} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Amina" />
          </div>
          <div>
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" maxLength={60} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Benali" />
          </div>
        </div>
        <div>
          <Label htmlFor="pseudo">Pseudo *</Label>
          <Input id="pseudo" value={form.pseudo} onChange={(e) => setForm({ ...form, pseudo: e.target.value })} onBlur={(e) => checkPseudo(e.target.value)} placeholder="amina_92" />
          {pseudoError && <p className="text-xs text-destructive mt-1">{pseudoError}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Téléphone *</Label>
          <PhoneInput id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} readOnly={isValidPhone(form.phone) && lockedPhone} />
          {lockedPhone && <p className="text-[11px] text-muted-foreground mt-1">Repris de votre inscription — il garantit un seul compte par personne.</p>}
        </div>
        <div>
          <Label>Je suis *</Label>
          <Select value={form.gender || undefined} onValueChange={(v: any) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="homme">Un homme</SelectItem>
              <SelectItem value="femme">Une femme</SelectItem>
            </SelectContent>
          </Select>
          {form.gender && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Vous verrez uniquement des profils {form.gender === "homme" ? "femmes" : "hommes"}.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Enfants *</Label>
          <YesNoRadio name="has_children" label="Avez-vous des enfants ?" value={form.has_children} onChange={(v) => setForm({ ...form, has_children: v, children_count: v ? form.children_count : "" })} />
          {form.has_children === true && (
            <div>
              <Label htmlFor="children_count">Combien d'enfants ? *</Label>
              <Select value={form.children_count} onValueChange={(v) => setForm({ ...form, children_count: v })}>
                <SelectTrigger id="children_count"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <YesNoRadio name="wants_children" label="Souhaitez-vous avoir des enfants ? *" value={form.wants_children} onChange={(v) => setForm({ ...form, wants_children: v })} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthdate">Date de naissance *</Label>
            <Input id="birthdate" type="date" required min={minBirthdate()} max={maxBirthdate()} value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
            <p className="text-[11px] text-muted-foreground mt-1">Inscription réservée aux 18 ans et plus.</p>
          </div>
          <div>
            <Label htmlFor="height_cm">Taille (cm)</Label>
            <Input id="height_cm" type="number" min={120} max={230} value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} placeholder="Ex. 175" />
          </div>
          <div>
            <Label>Corpulence</Label>
            <Select value={form.body_type || undefined} onValueChange={(v) => setForm({ ...form, body_type: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{BODY_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Situation *</Label>
            <Select value={form.marital_status || undefined} onValueChange={(v: any) => setForm({ ...form, marital_status: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="divorce">Divorcé·e</SelectItem>
                <SelectItem value="veuf">Veuf·ve</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Profession *</Label>
          <Select value={form.profession} onValueChange={(v) => setForm({ ...form, profession: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Ville de résidence *</Label>
            <CityAutocomplete
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              onCoords={(c) => setForm((f: any) => ({ ...f, latitude: c?.latitude ?? null, longitude: c?.longitude ?? null }))}
              suggestions={CITIES}
              placeholder="Commencez à taper votre ville..."
            />
          </div>
          <div>
            <Label>Pays de résidence *</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Pays d'origine *</Label>
            <Select value={form.country_origin} onValueChange={(v) => setForm({ ...form, country_origin: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Où as-tu grandi ?</Label>
            <Select value={form.grew_up} onValueChange={(v) => setForm({ ...form, grew_up: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Religion *</Label>
            <Select value={form.religion} onValueChange={(v) => setForm({ ...form, religion: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Pratique religieuse *</Label>
          <YesNoRadio name="salat" label="Salat quotidienne" value={form.salat_quotidienne} onChange={(v) => setForm({ ...form, salat_quotidienne: v })} />
          <YesNoRadio name="ramadan" label="Ramadan" value={form.ramadan} onChange={(v) => setForm({ ...form, ramadan: v })} />
          <YesNoRadio name="hadj" label="Avez-vous fait le Hadj ?" value={form.hadj} onChange={(v) => setForm({ ...form, hadj: v })} />
          <YesNoRadio name="omra" label="Avez-vous fait la Omra ?" value={form.omra} onChange={(v) => setForm({ ...form, omra: v })} />
          {form.gender === "femme" && (
            <YesNoRadio name="voile" label="Portez-vous le voile ?" value={form.porte_voile} onChange={(v) => setForm({ ...form, porte_voile: v })} />
          )}
        </div>
        <div>
          <Label>Niveau d'études *</Label>
          <Select value={form.education_level} onValueChange={(v) => setForm({ ...form, education_level: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Activités / centres d'intérêt * (3 max)</Label>
          <ActivitiesPicker value={form.activities} onChange={(v) => setForm({ ...form, activities: v })} />
        </div>
        <div>
          <Label>Type de personnalité</Label>
          <PersonalityPicker value={form.personality} onChange={(v) => setForm({ ...form, personality: v ?? "" })} />
        </div>
        <div className="space-y-2">
          <Label>Mode de vie *</Label>
          <YesNoRadio name="smoker" label="Fumez-vous ?" value={form.smoker} onChange={(v) => setForm({ ...form, smoker: v })} />
        </div>
        <div>
          <Label>Mon objectif sur Nooryaa *</Label>
          <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
            <SelectContent>
              {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bio">À propos de vous et de votre objectif *</Label>
          <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} maxLength={500} placeholder="Présentez-vous et expliquez ce que vous recherchez..." />
          <div className="mt-1 flex items-center justify-between text-xs">
            {form.bio.length < 50 ? (
              <span className="font-medium text-destructive">Encore {50 - form.bio.length} caractère{50 - form.bio.length > 1 ? "s" : ""} minimum</span>
            ) : (
              <span className="font-medium text-emerald-600">Minimum atteint ✓</span>
            )}
            <span className={form.bio.length >= 450 ? "font-medium text-destructive" : "text-muted-foreground"}>{form.bio.length}/500</span>
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-border/60 p-4">
          <Label>Photos de profil *</Label>
          <PhotoManager userId={ctx.userId} />
        </div>
        <SelfieVerification
          userId={ctx.userId}
          onVerified={() => setForm((f) => ({ ...f, photo_verified: true }))}
        />
        <p className="text-xs text-muted-foreground">
          {selfieRequired && !form.photo_verified
            ? t("La vérification par selfie est obligatoire pour finaliser votre profil.")
            : form.photo_verified
              ? t("Votre photo est vérifiée ✅")
              : t("Vérification par selfie (facultative) : elle ajoute un badge vérifié à votre profil.")}
        </p>
        <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? "Enregistrement..." : "Continuer"}
        </Button>
      </form>
    </div>
  );
}