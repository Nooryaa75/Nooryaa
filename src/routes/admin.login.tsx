import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin, adminCheckAuth } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (authed) throw redirect({ to: "/admin" });
  },
  component: AdminLogin,
});

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useServerFn(adminLogin);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { ok } = await login({ data: { password } });
      if (!ok) { toast.error("Mot de passe incorrect"); return; }
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background vignette px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 gold-frame space-y-4">
        <div className="flex flex-col items-center gap-2">
          <img src={logoAsset.url} alt="Logo Nooryaa" className="h-14 w-14 rounded-full object-cover gold-glow" />
          <div className="gold-rule w-24" />
          <h1 className="text-xl font-serif gold-text tracking-[0.12em] uppercase">Espace administration</h1>
          <p className="text-xs text-muted-foreground">Accès réservé à l'équipe Nooryaa</p>
        </div>
        <div>
          <Label htmlFor="pwd">Mot de passe</Label>
          <Input id="pwd" type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full rounded-full">
          {loading ? "Vérification..." : "Entrer"}
        </Button>
      </form>
    </div>
  );
}