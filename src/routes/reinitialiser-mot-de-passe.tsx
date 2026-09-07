import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Nooryaa" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte Nooryaa en toute sécurité." },
      { property: "og:title", content: "Nouveau mot de passe — Nooryaa" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe pour votre compte Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ResetPassword,
});

function PasswordField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
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
    </div>
  );
}

function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const tokenHash = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
        const code = url.searchParams.get("code");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        }

        const { data } = await supabase.auth.getSession();
        setReady(Boolean(data.session));
      } catch {
        setReady(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (password !== password2) { toast.error("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Mot de passe mis à jour. Vous pouvez vous connecter.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err: any) {
      toast.error(frenchError(err, "Impossible de mettre à jour le mot de passe."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--cream)]/40 px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border/60">
        <Link to="/" className="block text-center mb-3">
          <img src={logoAsset.url} alt="Nooryaa" className="mx-auto h-24 w-auto rounded-2xl object-contain" />
        </Link>
        <h1 className="text-2xl font-serif text-center text-primary mb-1">Nouveau mot de passe</h1>

        {checking ? (
          <p className="text-center text-sm text-muted-foreground mt-4">Vérification du lien...</p>
        ) : !ready ? (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground mb-5">
              Ce lien est invalide ou a expiré. Demandez-en un nouveau, il reste valable 1 heure.
            </p>
            <Button asChild className="w-full rounded-full">
              <Link to="/mot-de-passe-oublie">Recevoir un nouveau lien</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground mb-6">Choisissez un mot de passe d'au moins 6 caractères.</p>
            <form onSubmit={submit} className="space-y-4">
              <PasswordField id="pwd" label="Nouveau mot de passe" value={password} onChange={setPassword} />
              <PasswordField id="pwd2" label="Confirmer le mot de passe" value={password2} onChange={setPassword2} />
              {password2 && password !== password2 && (
                <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
              )}
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Enregistrement..." : "Enregistrer mon mot de passe"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
