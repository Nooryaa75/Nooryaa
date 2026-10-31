import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BirthdateWheel } from "@/components/BirthdateWheel";
import { OriginsPicker } from "@/components/OriginsPicker";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CITIES, COUNTRIES, ageFromBirthdate, isAdult } from "@/lib/profile";
import { loadPresignup, savePresignup, type PresignupAnswers } from "@/lib/presignup";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { MapPin, ShieldCheck } from "lucide-react";
import hommeImg from "@/assets/gender-homme.png";
import femmeImg from "@/assets/gender-femme.png";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

export const Route = createFileRoute("/inscription")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Inscription — Nooryaa" },
    { name: "description", content: "Créez votre compte Nooryaa étape par étape : quelques questions simples pour des rencontres sérieuses dans le dîn." },
    { property: "og:title", content: "Inscription — Nooryaa" },
    { property: "og:description", content: "Rejoignez Nooryaa en quelques étapes guidées pour un mariage halal sérieux." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: InscriptionWizard,
});

const STEP_TITLES = [
  "Bienvenue sur Nooryaa",
  "Votre pseudo",
  "Votre date de naissance",
  "Vos origines",
  "Votre position",
  "Où vivez-vous ?",
  "Créer votre compte",
];

function InscriptionWizard() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PresignupAnswers>(() => loadPresignup());
  const [ageDialogOpen, setAgeDialogOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  // Déjà connecté : on renvoie vers la fiche, sauf si les questions guidées
  // n'ont jamais été posées (compte Google/Apple créé depuis la connexion).
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: profile } = await supabase
        .from("profiles").select("gender, birthdate, onboarded").eq("id", data.session.user.id).maybeSingle();
      if ((profile as any)?.onboarded || (profile as any)?.gender || (profile as any)?.birthdate) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setSignedIn(true);
    });
  }, [navigate]);

  function update(patch: Partial<PresignupAnswers>) {
    setAnswers((prev) => {
      const next = { ...prev, ...patch };
      savePresignup(next);
      return next;
    });
  }

  function scrollTop() {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
    scrollTop();
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }

  function nextFromBirthdate() {
    if (!answers.birthdate) {
      toast.error(t("Choisissez votre date de naissance."));
      return;
    }
    if (!isAdult(answers.birthdate)) {
      toast.error(t("Vous devez avoir au moins 18 ans pour vous inscrire."));
      return;
    }
    setAgeDialogOpen(true);
  }

  async function enableLocation() {
    if (!("geolocation" in navigator)) {
      toast.error(t("La localisation n'est pas disponible sur cet appareil."));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city: string | undefined;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
          );
          if (res.ok) {
            const data = await res.json();
            city = data.city || data.locality || undefined;
          }
        } catch {
          /* la ville restera à saisir à la main */
        }
        update({ latitude, longitude, ...(city ? { city } : {}) });
        setLocating(false);
        toast.success(t("Position enregistrée, merci !"));
        goNext();
      },
      () => {
        setLocating(false);
        toast.error(t("Position non partagée. Vous pourrez indiquer votre ville à la main."));
        goNext();
      },
      { timeout: 10000 },
    );
  }

  const age = answers.birthdate ? ageFromBirthdate(answers.birthdate) : null;

  return (
    <div className="min-h-screen bg-[color:var(--cream)]/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-6 md:p-8 border border-border/60">
        <Link to="/" className="block text-center mb-4">
          <img src={logoAsset.url} alt="Nooryaa" className="mx-auto h-20 w-auto rounded-2xl object-contain" />
        </Link>
        <div className="mx-auto mb-5 max-w-xs">
          <LanguageSwitcher inline />
        </div>

        <h1 className="text-2xl font-serif text-center text-primary mb-6">{t(signedIn && step === STEP_TITLES.length - 1 ? "Presque terminé" : STEP_TITLES[step])}</h1>

        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-center text-sm text-muted-foreground">{t("Pour commencer, dites-nous :")}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { update({ gender: "homme" }); goNext(); }}
                className={`rounded-2xl border-2 p-6 text-center transition-colors ${
                  answers.gender === "homme" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <img src={hommeImg} alt="" width={96} height={96} className="mx-auto mb-2 h-24 w-24 object-contain" />
                <span className="font-medium">{t("Je suis un homme")}</span>
              </button>
              <button
                type="button"
                onClick={() => { update({ gender: "femme" }); goNext(); }}
                className={`rounded-2xl border-2 p-6 text-center transition-colors ${
                  answers.gender === "femme" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <img src={femmeImg} alt="" width={96} height={96} className="mx-auto mb-2 h-24 w-24 object-contain" />
                <span className="font-medium">{t("Je suis une femme")}</span>
              </button>
            </div>
            {answers.gender && (
              <p className="text-center text-[11px] text-muted-foreground">
                {answers.gender === "homme"
                  ? t("Vous verrez uniquement des profils de femmes.")
                  : t("Vous verrez uniquement des profils d'hommes.")}
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground">
              {t("C'est le nom que les autres membres verront. Choisissez-en un qui vous plaît — pas besoin de votre vrai prénom.")}
            </p>
            <div>
              <Label htmlFor="pseudo">{t("Pseudo")}</Label>
              <Input
                id="pseudo"
                value={answers.pseudo ?? ""}
                onChange={(e) => update({ pseudo: e.target.value })}
                placeholder="amina_92"
                autoFocus
              />
            </div>
            <Button
              className="w-full rounded-full" size="lg"
              disabled={!(answers.pseudo ?? "").trim()}
              onClick={goNext}
            >
              {t("Suivant")}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground">
              {t("Faites défiler pour choisir votre date de naissance. L'inscription est réservée aux 18 ans et plus.")}
            </p>
            <BirthdateWheel
              value={answers.birthdate ?? ""}
              onChange={(birthdate) => update({ birthdate })}
            />
            <Button className="w-full rounded-full" size="lg" onClick={nextFromBirthdate}>
              {t("Suivant")}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground">
              {t("D'où vient votre famille ? Vous pouvez choisir jusqu'à 3 pays d'origine.")}
            </p>
            <OriginsPicker
              value={answers.origins ?? []}
              onChange={(origins) => update({ origins })}
            />
            <div className="space-y-1.5">
              <Label htmlFor="grew_up">{t("Où as-tu grandi ?")}</Label>
              <Select value={answers.grewUp ?? ""} onValueChange={(v) => update({ grewUp: v })}>
                <SelectTrigger id="grew_up"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-full" size="lg"
              disabled={(answers.origins ?? []).length === 0 || !answers.grewUp?.trim()}
              onClick={goNext}
            >
              {t("Suivant")}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border border-primary/25 bg-secondary/40 p-4 text-sm space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium text-primary">{t("Pourquoi nous demandons votre position ?")}</span>
              </p>
              <p className="text-muted-foreground">
                {t("Nooryaa vous propose des profils proches de chez vous. Votre position exacte n'est jamais affichée : les autres membres voient seulement votre ville.")}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                {t("Vous pouvez refuser et indiquer votre ville à la main à l'étape suivante.")}
              </p>
            </div>
            <Button className="w-full rounded-full" size="lg" disabled={locating} onClick={enableLocation}>
              {locating ? t("Localisation en cours...") : t("Activer la localisation")}
            </Button>
            <button
              type="button"
              onClick={goNext}
              className="w-full text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-primary"
            >
              {t("Continuer sans partager ma position")}
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <Label>{t("Ville de résidence")}</Label>
              <CityAutocomplete
                value={answers.city ?? ""}
                onChange={(city) => update({ city })}
                onCoords={(c) => update({ latitude: c?.latitude ?? null, longitude: c?.longitude ?? null })}
                suggestions={CITIES}
                placeholder={t("Commencez à taper votre ville...")}
              />
            </div>
            <div>
              <Label>{t("Pays de résidence")}</Label>
              <Select value={answers.country ?? ""} onValueChange={(country) => update({ country })}>
                <SelectTrigger><SelectValue placeholder={t("Choisir")} /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-full" size="lg"
              disabled={!(answers.city ?? "").trim() || !answers.country?.trim()}
              onClick={goNext}
            >
              {t("Suivant")}
            </Button>
          </div>
        )}

        {step === 6 && signedIn && (
          <div className="space-y-4 text-center animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground">
              {t("Merci ! Il reste quelques questions par thème pour compléter votre profil.")}
            </p>
            <Button className="w-full rounded-full" size="lg" onClick={() => navigate({ to: "/onboarding", replace: true })}>
              {t("Continuer")}
            </Button>
          </div>
        )}

        {step === 6 && !signedIn && (
          <div className="space-y-4 text-center animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-muted-foreground">
              {t("C'est presque fini ! Créez maintenant votre compte avec Google, Apple ou votre email, puis répondez à quelques questions par thème pour compléter votre profil.")}
            </p>
            <Button asChild className="w-full rounded-full" size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>{t("Créer mon compte")}</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("Déjà inscrit·e ? ")}{" "}
              <Link to="/auth" search={{ mode: "signin" }} className="text-primary underline underline-offset-4">
                {t("Connexion")}
              </Link>
            </p>
          </div>
        )}

        {step > 0 && step < STEP_TITLES.length - 1 && (
          <button
            type="button"
            onClick={goBack}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {t("Retour")}
          </button>
        )}

        <div className="pt-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t(STEP_TITLES[step])}</span>
            <span>{step + 1} / {STEP_TITLES.length}</span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-secondary overflow-hidden"
            role="progressbar" aria-valuemin={1} aria-valuemax={STEP_TITLES.length} aria-valuenow={step + 1}
          >
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <Dialog open={ageDialogOpen} onOpenChange={setAgeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("Confirmez votre âge")}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {t("Vous avez indiqué avoir ")}{age !== null ? <strong data-no-translate>{age} {t("ans")}</strong> : null}.
                </p>
                <p>
                  {t("Merci d'indiquer votre vrai âge : il sera visible sur votre profil et ne pourra plus être modifié. Un faux âge peut entraîner la suspension du compte.")}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setAgeDialogOpen(false)}>
              {t("Je corrige")}
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={() => { setAgeDialogOpen(false); goNext(); }}
            >
              {t("Je confirme")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
