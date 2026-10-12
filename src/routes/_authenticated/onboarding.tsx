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
import { OBJECTIVES, COUNTRIES, CITIES, maxBirthdate, minBirthdate, isAdult } from "@/lib/profile";
import { EyeOff } from "lucide-react";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { PhotoManager } from "@/components/PhotoManager";
import { SelfieVerification } from "@/components/SelfieVerification";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { frenchError } from "@/lib/errors";
import { useI18n } from "@/lib/i18n";


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
    firstName: "",
    lastName: "",
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

  function computeMissing(): string[] {
    const missing: string[] = [];
    if (form.firstName.trim().length < 2) missing.push("Prénom");
    if (form.lastName.trim().length < 2) missing.push("Nom");
    if (!form.pseudo.trim()) missing.push("Pseudo");
    if (!form.gender) missing.push("Je suis");
    if (!form.grew_up) missing.push("Où as-tu grandi");
    if (!form.birthdate) missing.push("Date de naissance");
    if (!form.marital_status) missing.push("Situation");
    if (!isValidPhone(form.phone)) missing.push("Téléphone (numéro valide)");
    if (!form.city) missing.push("Ville de résidence");
    if (!form.country) missing.push("Pays de résidence");
    if (!form.country_origin) missing.push("Pays d'origine");
    if (!form.activities) missing.push("Activités / centres d'intérêt");
    if (!form.objective) missing.push("Mon objectif sur Nooryaa");
    if (form.bio.length < 30 || form.bio.length > 500) missing.push("À propos de vous (30 à 500 caractères)");
    return missing;
  }
  const missingFields = attempted ? computeMissing() : [];

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
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthdate">Date de naissance *</Label>
            <Input id="birthdate" type="date" required min={minBirthdate()} max={maxBirthdate()} value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
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
        <div>
          <Label>Activités / centres d'intérêt * (3 max)</Label>
          <ActivitiesPicker value={form.activities} onChange={(v) => setForm({ ...form, activities: v })} />
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
            {form.bio.length < 30 ? (
              <span className="font-medium text-destructive">Encore {30 - form.bio.length} caractère{30 - form.bio.length > 1 ? "s" : ""} minimum</span>
            ) : (
              <span className="font-medium text-emerald-600">Minimum atteint ✓</span>
            )}
            <span className={form.bio.length >= 450 ? "font-medium text-destructive" : "text-muted-foreground"}>{form.bio.length}/500</span>
          </div>
        </div>
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
        <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? "Enregistrement..." : "Continuer"}
        </Button>
      </form>
    </div>
  );
}