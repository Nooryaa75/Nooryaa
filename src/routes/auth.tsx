import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Connexion — Nooryaa (Abonnement gratuit)" }] }),
  component: AuthPage,
});

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/browse" });
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (error) {
          if (/already registered|exists/i.test(error.message)) throw new Error("Cet email est déjà utilisé.");
          if (/duplicate key|unique constraint|Database error/i.test(error.message)) {
            throw new Error("Un compte existe déjà avec cet email, ce numéro de téléphone ou cette identité.");
          }
          throw error;
        }
        toast.success("Compte créé ! Vous pouvez compléter votre profil.");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/browse" });
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
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
    navigate({ to: "/onboarding" });
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
    navigate({ to: "/onboarding" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--cream)]/40 px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border/60">
        <Link to="/" className="block text-center text-2xl font-serif text-primary mb-1">Nooryaa</Link>
        <div className="text-center mb-3">
          <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] font-medium">Abonnement gratuit</span>
        </div>
        <h1 className="text-2xl font-serif text-center text-primary mb-1">
          {mode === "signup" ? "Créer un compte" : "Bon retour"}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          {mode === "signup" ? "Commencez votre recherche aujourd'hui — c'est gratuit." : "Connectez-vous à votre profil"}
        </p>

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
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" && (
            <div>
              <Label htmlFor="password2">Confirmer le mot de passe</Label>
              <Input id="password2" type="password" required minLength={6} value={password2} onChange={(e) => setPassword2(e.target.value)} />
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