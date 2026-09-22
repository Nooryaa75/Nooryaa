import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { StoreBadges } from "@/components/StoreBadges";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { sendWelcomeEmail } from "@/lib/notify.functions";
import { signUpByServer, resendSignupConfirmation } from "@/lib/auth.functions";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
});

function frenchAuthError(message?: string) {
  const m = message || "";
  if (/invalid login credentials/i.test(m)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(m)) return "Votre email n'est pas encore confirmé. Vérifiez votre boîte mail.";
  if (/user already registered/i.test(m)) return "Cet email est déjà utilisé.";
  if (/rate limit|too many/i.test(m)) return "Trop de tentatives. Merci de réessayer dans quelques minutes.";
  if (/weak|pwned|easy to guess|known to be weak|common|compromised/i.test(m)) return "Ce mot de passe est trop courant. Choisissez-en un plus original (lettres, chiffres et symboles).";
  if (/load failed|failed to fetch|networkerror|network request failed|network|fetch|timeout|aborted/i.test(m)) {
    return "Connexion au serveur interrompue. Si vous utilisez un VPN, un pare-feu, un mode économie de données ou un bloqueur, désactivez-les momentanément puis réessayez.";
  }
  return m || "Une erreur est survenue";
}

function isNetworkError(err: any) {
  const m = String(err?.message || "");
  return /load failed|failed to fetch|networkerror|network request failed|timeout|aborted/i.test(m);
}

// Certains réseaux mobiles / VPN / pare-feu coupent les requêtes : on réessaie plusieurs fois.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isNetworkError(err)) throw err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}



async function redirectAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    navigate({ to: "/auth", search: { mode: "signin" } });
    return;
  }
  // Les comptes administrateurs arrivent directement dans le back-office.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin");
  if (roles && roles.length > 0) {
    navigate({ to: "/admin" });
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userData.user.id)
    .maybeSingle();
  navigate({ to: profile?.onboarded ? "/browse" : "/onboarding" });
}


export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Connexion — Nooryaa (Abonnement gratuit)" }] }),
  component: AuthPage,
});

function PasswordInput({ id, value, onChange, ...rest }: { id: string; value: string; onChange: (v: string) => void } & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function passwordStrength(p: string) {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return score;
}

function PasswordStrength({ password }: { password: string }) {
  const score = passwordStrength(password);
  if (!password) return null;
  const labels = ["Faible", "Moyen", "Correct", "Sécurisé"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const text = ["text-red-500", "text-orange-500", "text-yellow-500", "text-green-500"];
  const index = Math.max(0, Math.min(score - 1, 3));
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[index] : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${text[index]}`}>{labels[index]}</p>
      <ul className="text-[10px] text-muted-foreground space-y-0.5">
        <li className={password.length >= 8 ? "text-green-500" : ""}>Au moins 8 caractères</li>
        <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "text-green-500" : ""}>Majuscules et minuscules</li>
        <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>Au moins un chiffre</li>
        <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>Au moins un caractère spécial</li>
      </ul>
    </div>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      await redirectAfterAuth(navigate);
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
        if (password !== password2) throw new Error("Les deux mots de passe ne correspondent pas.");
        if (firstName.trim().length < 2 || lastName.trim().length < 2) {
          throw new Error("Merci d'indiquer votre prénom et votre nom.");
        }
        const digits = phone.replace(/[^0-9]/g, "");
        if (digits.length < 8 || digits.length > 15) {
          throw new Error("Merci d'indiquer un numéro de téléphone valide.");
        }
        // L'email de vérification est toujours envoyé par notre serveur via Resend
        // (expéditeur noreply@info.nooryaa.com, template Nooryaa).

        const signupResult = await signUpByServer({
          data: {
            email: email.trim().toLowerCase(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            origin: window.location.origin,
            locale,
          },
        });
        void sendWelcomeEmail({ data: { email: email.trim().toLowerCase(), locale } }).catch(() => {});
        setSignupEmailSent(true);
        if (signupResult?.emailSent) {
          toast.success("Email de confirmation envoyé ! Vérifiez votre boîte de réception.");
        } else {
          toast.error(
            "Votre compte est créé mais l'email de confirmation n'a pas pu partir. Utilisez le bouton « Renvoyer l'email ».",
          );
        }
        return;


      } else {
        const { error } = await withRetry(() =>
          supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
        );
        if (error) throw error;
        await redirectAfterAuth(navigate);
      }
    } catch (err: any) {
      toast.error(frenchAuthError(err?.message));

    } finally {
      setLoading(false);
    }
  }


  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Google impossible");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    await redirectAfterAuth(navigate);
  }

  async function handleApple() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Apple impossible");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    await redirectAfterAuth(navigate);
  }

  if (signupEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--cream)]/40 px-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border/60 text-center">
          <Link to="/" className="block text-2xl font-serif text-primary mb-4">Nooryaa</Link>
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[color:var(--gold)]/15 flex items-center justify-center text-2xl">✉️</div>
          <h1 className="text-2xl font-serif text-primary mb-2">Vérifiez votre boîte mail</h1>
          <p className="text-sm text-muted-foreground mb-2">
            Nous avons envoyé un email de confirmation à <span className="font-medium text-foreground">{email}</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Cliquez sur le lien reçu pour activer votre compte, puis revenez compléter votre profil.
            Pensez à regarder dans vos courriers indésirables.
          </p>
          <Button asChild className="w-full rounded-full mb-3">
            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setSignupEmailSent(false)}>
              J'ai confirmé, je me connecte
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full mb-3"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const r = await resendSignupConfirmation({
                  data: { email: email.trim().toLowerCase(), origin: window.location.origin },
                });
                if (r?.emailSent) toast.success("Email renvoyé ! Vérifiez votre boîte de réception.");
                else toast.error("L'envoi a échoué. Réessayez dans quelques minutes.");
              } catch (e: any) {
                toast.error(e?.message || "L'envoi a échoué. Réessayez dans quelques minutes.");
              } finally {
                setLoading(false);
              }
            }}
          >
            Renvoyer l'email
          </Button>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">Retour à l'accueil</Link>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--cream)]/40 px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border/60">
        <Link to="/" className="block text-center mb-3">
          <img
            src={logoAsset.url}
            alt="Nooryaa"
            className="mx-auto h-28 w-auto rounded-2xl object-contain"
          />
        </Link>
        <div className="mx-auto mb-5 max-w-xs">
          <LanguageSwitcher inline />
        </div>
        <h1 className="text-2xl font-serif text-center text-primary mb-1">
          {mode === "signup" ? "Créer un compte" : "Connexion"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-3">
          {mode === "signup" ? "Commencez votre recherche aujourd'hui — c'est gratuit." : "Connectez-vous à votre profil"}
        </p>

        <div className="mb-5">
          <StoreBadges />
        </div>

        <Button
          onClick={handleGoogle}
          disabled={loading}
          variant="outline"
          className="w-full rounded-full mb-3 gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.1z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2c-.4.4 6.7-4.9 6.7-14.8 0-1.2-.1-2.4-.4-3.5z"/></svg>
          Continuer avec Google
        </Button>

        <Button
          onClick={handleApple}
          disabled={loading}
          variant="outline"
          className="w-full rounded-full mb-4 gap-2 bg-foreground text-background hover:bg-foreground/90 hover:text-background"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.84-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          Continuer avec Apple
        </Button>

        <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" />ou<div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" required maxLength={60} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" required maxLength={60} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
                <p className="text-[11px] text-muted-foreground mt-1">Non visible sur votre profil. Sert à garantir un seul compte par personne.</p>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email (identifiant de connexion)</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <PasswordInput id="password" required minLength={6} value={password} onChange={setPassword} />
            {mode === "signup" && <PasswordStrength password={password} />}
            {mode === "signin" && (
              <p className="text-right mt-1">
                <Link to="/mot-de-passe-oublie" className="text-xs text-muted-foreground hover:text-primary underline underline-offset-4">
                  Mot de passe oublié ?
                </Link>
              </p>
            )}
          </div>
          {mode === "signup" && (
            <div>
              <Label htmlFor="password2">Confirmer le mot de passe</Label>
              <PasswordInput id="password2" required minLength={6} value={password2} onChange={setPassword2} />
              {password2 && password !== password2 && (
                <p className="text-[11px] text-destructive mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-full">
            {loading ? "Chargement..." : mode === "signup" ? "Créer mon compte gratuit" : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {mode === "signup" ? "Déjà inscrit·e ? " : "Pas encore de compte ? "}
          <Link to="/auth" search={{ mode: mode === "signup" ? "signin" : "signup" }} className="text-primary underline underline-offset-4">
            {mode === "signup" ? "Connexion" : "S'inscrire"}
          </Link>
        </p>

      </div>
    </div>
  );
}