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
import { OBJECTIVES, COUNTRIES, CITIES, isAdult } from "@/lib/profile";
import { EyeOff } from "lucide-react";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { PhotoManager } from "@/components/PhotoManager";
import { SelfieVerification } from "@/components/SelfieVerification";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { frenchError } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";
import { OpenInAppButton } from "@/components/OpenInAppButton";
import { BirthdateCalendar } from "@/components/BirthdateCalendar";


export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: "Compléter mon profil — Nooryaa" },
    { name: "description", content: "Créez votre profil Nooryaa avec les informations essentielles et une vérification confidentielle de votre identité." },
    { property: "og:title", content: "Compléter mon profil — Nooryaa" },
    { property: "og:description", content: "Renseignez les informations essentielles pour rejoindre Nooryaa et complétez les autres détails plus tard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const ctx = Route.useRouteContext();
  const { t } = useI18n();
  const [lockedPhone, setLockedPhone] = useState(false);
  const [form, setForm] = useState({
    pseudo: "",
    gender: "" as "homme" | "femme" | "",
    birthdate: "",
    phone: "",
    city: "",
    country: "France",
    country_origin: "",
    grew_up: "",
    marital_status: "" as "celibataire" | "divorce" | "veuf" | "",
    activities: "",
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

  const STEPS = ["Qui êtes-vous ?", "Vos origines et votre lieu de vie", "Vos envies et votre objectif", "Vos photos et la vérification"];
  const [step, setStep] = useState(0);

  function checks(): [number, string, boolean][] {
    return [
      [0, t("Pseudo"), !!form.pseudo.trim()],
      [0, t("Téléphone (numéro valide)"), lockedPhone || isValidPhone(form.phone)],
      [0, t("Je suis"), !!form.gender],
      [0, t("Date de naissance"), !!form.birthdate],
      [0, t("Situation"), !!form.marital_status],
      [1, t("Ville de résidence"), !!form.city],
      [1, t("Pays de résidence"), !!form.country],
      [1, t("Pays d'origine"), !!form.country_origin],
      [1, t("Où as-tu grandi"), !!form.grew_up],
      [2, t("Mon objectif sur Nooryaa"), !!form.objective],
      [2, t("À propos de vous (30 à 500 caractères)"), form.bio.length >= 30 && form.bio.length <= 500],
    ];
  }
  function computeMissing(upTo = 3): string[] {
    return checks().filter(([s, , ok]) => s <= upTo && !ok).map(([, l]) => l);
  }
  const missingFields = attempted ? computeMissing(step) : [];

  function scrollTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function goNext() {
    setAttempted(true);
    if (step === 0 && !(await checkPseudo(form.pseudo))) { scrollTop(); return; }
    if (step === 0 && form.birthdate && !isAdult(form.birthdate)) {
      toast.error("Vous devez avoir au moins 18 ans pour vous inscrire."); return;
    }
    if (computeMissing(step).length > 0) { scrollTop(); return; }
    setAttempted(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  }
  function goBack() {
    setAttempted(false);
    setExtraError(null);
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", ctx.userId).maybeSingle().then(({ data }) => {
      if (data && isValidPhone((data as any).phone)) setLockedPhone(true);
      if (data) setForm((f) => ({
        ...f,
        pseudo: data.pseudo && !data.pseudo.startsWith("user_") ? data.pseudo : f.pseudo,
        // Pré-remplissage avec les infos déjà connues (inscription) — on ignore un numéro invalide
        phone: isValidPhone((data as any).phone) ? (data as any).phone : f.phone,
        gender: ((data as any).gender as any) || f.gender,
        birthdate: (data as any).birthdate || f.birthdate,
        city: (data as any).city || f.city,
        country: (data as any).country || f.country,
        country_origin: (data as any).country_origin || f.country_origin,
        grew_up: data.grew_up || f.grew_up,
        marital_status: data.marital_status || f.marital_status,
        activities: data.activities || f.activities,
        objective: data.objective || f.objective,
        bio: data.bio || f.bio,
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
    if (step < STEPS.length - 1) { await goNext(); return; }
    setAttempted(true);
    if (!(await checkPseudo(form.pseudo))) { setStep(0); scrollTop(); return; }
    const failing = checks().find(([, , ok]) => !ok);
    if (failing) { setStep(failing[0]); scrollTop(); return; }
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
      gender: form.gender as any,
      looking_for: form.gender === "homme" ? "femme" : "homme",
      birthdate: form.birthdate,
      phone: form.phone || null,
      city: form.city || null,
      latitude: (form as any).latitude ?? null,
      longitude: (form as any).longitude ?? null,
      country: form.country || null,
      country_origin: form.country_origin || null,
      grew_up: form.grew_up || null,
      marital_status: form.marital_status as any,
      activities: form.activities || null,
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
      <p className="text-muted-foreground text-sm mb-2">{t("Les champs marqués * sont obligatoires pour finaliser votre profil.")}</p>
      <p className="text-muted-foreground text-sm mb-6">{t("Seulement l'essentiel pour commencer. Vous pourrez ajouter les autres informations plus tard dans Mon profil.")}</p>
      <OpenInAppButton />
      <h2 className="text-lg font-serif text-primary mb-4">{t(STEPS[step])}</h2>
      {(missingFields.length > 0 || extraError || (attempted && pseudoError && step === 0)) && (
        <div ref={errorBoxRef} className="mb-5 rounded-xl border border-destructive/50 bg-destructive/10 p-4" role="alert">
          <p className="font-semibold text-destructive text-sm">{t("Champs obligatoires à compléter :")}</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-destructive space-y-0.5">
            {pseudoError && attempted && step === 0 && <li>{t("Pseudo :")} {pseudoError}</li>}
            {missingFields.map((m) => <li key={m}>{m}</li>)}
            {extraError && missingFields.length === 0 && <li>{extraError}</li>}
          </ul>
        </div>
      )}
      <form onSubmit={submit} className="space-y-5">
        {step === 0 && (<div key="s0" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <Label htmlFor="pseudo">Pseudo *</Label>
          <Input id="pseudo" value={form.pseudo} onChange={(e) => setForm({ ...form, pseudo: e.target.value })} onBlur={(e) => checkPseudo(e.target.value)} placeholder="amina_92" />
          {pseudoError && <p className="text-xs text-destructive mt-1">{pseudoError}</p>}
        </div>
        {lockedPhone ? (
          <p className="text-[11px] text-muted-foreground">{t("Téléphone repris de votre inscription — il garantit un seul compte par personne.")}</p>
        ) : (
          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <PhoneInput id="phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <p className="text-[11px] text-muted-foreground mt-1">{t("Il garantit un seul compte par personne.")}</p>
          </div>
        )}
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
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthdate">Date de naissance *</Label>
            <BirthdateCalendar id="birthdate" value={form.birthdate} onChange={(birthdate) => setForm({ ...form, birthdate })} />
            <p className="text-[11px] text-muted-foreground mt-1">Inscription réservée aux 18 ans et plus.</p>
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
        </div>)}
        {step === 1 && (<div key="s1" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
            <Label>Où as-tu grandi ? *</Label>
            <Select value={form.grew_up} onValueChange={(v) => setForm({ ...form, grew_up: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>)}
        {step === 2 && (<div key="s2" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
            {form.bio.length < 30 ? (
              <span className="font-medium text-destructive">Encore {30 - form.bio.length} caractère{30 - form.bio.length > 1 ? "s" : ""} minimum</span>
            ) : (
              <span className="font-medium text-emerald-600">Minimum atteint ✓</span>
            )}
            <span className={form.bio.length >= 450 ? "font-medium text-destructive" : "text-muted-foreground"}>{form.bio.length}/500</span>
          </div>
        </div>
        </div>)}
        {step === 3 && (<div key="s3" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-2 rounded-xl border border-border/60 p-4">
          <Label>Photos de profil *</Label>
          <div className="flex items-start gap-2 bg-secondary/40 p-3 rounded-lg">
            <EyeOff className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-primary">{t("Votre photo, votre choix")}</p>
              <p className="text-muted-foreground">{t("Vous pouvez flouter vos photos en cochant « Flouter cette photo ». Les autres membres ne les verront pas en clair ; vous seul·e décidez de retirer le floutage.")}</p>
            </div>
          </div>
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
        </div>)}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" size="lg" className="flex-1 rounded-full" onClick={goBack}>
              {t("Retour")}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" className="flex-1 rounded-full" onClick={goNext}>
              {t("Suivant")}
            </Button>
          ) : (
            <Button type="submit" disabled={loading} size="lg" className="flex-1 rounded-full">
              {loading ? "Enregistrement..." : t("Terminer mon profil")}
            </Button>
          )}
        </div>
        <div className="pt-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t(STEPS[step])}</span>
            <span>{step + 1} / {STEPS.length}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>
      </form>
    </div>
  );
}