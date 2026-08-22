import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ageFromBirthdate, PRACTICE_LABELS } from "@/lib/profile";
import { MapPin, Search, User } from "lucide-react";
import { EDUCATION_LEVELS } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Découvrir — Nooryaa" }] }),
  component: Browse,
});

function Browse() {
  const ctx = Route.useRouteContext();
  const [filters, setFilters] = useState({
    ageMin: 18, ageMax: 60, city: "", country: "",
    practice: "any", marital: "any", education: "any",
  });

  const { data: me } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["browse", ctx.userId, me?.looking_for, filters],
    enabled: !!me,
    queryFn: async () => {
      // Récupère les blocages dans les deux sens pour les exclure
      const [{ data: iBlock }, { data: blockedMe }] = await Promise.all([
        supabase.from("blocks").select("blocked").eq("blocker", ctx.userId),
        supabase.from("blocks").select("blocker").eq("blocked", ctx.userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
      ]);
      const today = new Date();
      const maxBirth = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      const minBirth = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      let q = supabase.from("profiles").select("*").eq("onboarded", true).eq("status", "active").neq("id", ctx.userId);
      // Femme voit uniquement les hommes, homme voit uniquement les femmes
      if (me?.gender === "homme") q = q.eq("gender", "femme");
      else if (me?.gender === "femme") q = q.eq("gender", "homme");
      q = q.gte("birthdate", minBirth).lte("birthdate", maxBirth);
      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.country) q = q.ilike("country", `%${filters.country}%`);
      if (filters.practice !== "any") q = q.eq("religious_practice", filters.practice as any);
      if (filters.marital !== "any") q = q.eq("marital_status", filters.marital as any);
      if (filters.education !== "any") q = q.eq("education_level", filters.education);
      const { data, error } = await q.order("last_active", { ascending: false }).limit(80);
      if (error) throw error;
      return (data ?? []).filter((p) => !excluded.has(p.id));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary">Découvrir</h1>
        <p className="text-muted-foreground text-sm">Affinez votre recherche. Nooryaa est Abonnement gratuit.</p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-card)] border border-border/60 grid md:grid-cols-3 lg:grid-cols-7 gap-3">
        <div>
          <Label className="text-xs">Âge min</Label>
          <Input type="number" min={18} max={99} value={filters.ageMin} onChange={(e) => setFilters({ ...filters, ageMin: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Âge max</Label>
          <Input type="number" min={18} max={99} value={filters.ageMax} onChange={(e) => setFilters({ ...filters, ageMax: Number(e.target.value) })} />
        </div>
        <div>
          <Label className="text-xs">Ville</Label>
          <Input value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} placeholder="Lyon..." />
        </div>
        <div>
          <Label className="text-xs">Pays</Label>
          <Input value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })} placeholder="France..." />
        </div>
        <div>
          <Label className="text-xs">Pratique</Label>
          <Select value={filters.practice} onValueChange={(v) => setFilters({ ...filters, practice: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Toutes</SelectItem>
              <SelectItem value="tres_pratiquant">Très pratiquant·e</SelectItem>
              <SelectItem value="pratiquant">Pratiquant·e</SelectItem>
              <SelectItem value="en_apprentissage">En apprentissage</SelectItem>
              <SelectItem value="non_pratiquant">Non pratiquant·e</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Situation</Label>
          <Select value={filters.marital} onValueChange={(v) => setFilters({ ...filters, marital: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Toutes</SelectItem>
              <SelectItem value="celibataire">Célibataire</SelectItem>
              <SelectItem value="divorce">Divorcé·e</SelectItem>
              <SelectItem value="veuf">Veuf·ve</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Études</Label>
          <Select value={filters.education} onValueChange={(v) => setFilters({ ...filters, education: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Tous</SelectItem>
              {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Chargement...</div>
      ) : !profiles || profiles.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <Search className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun profil ne correspond à vos critères pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {profiles.map((p) => (
            <Link
              key={p.id}
              to="/profile/$pseudo"
              params={{ pseudo: p.pseudo }}
              className="group bg-card rounded-2xl overflow-hidden border border-border/60 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow"
            >
              <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                {p.primary_photo_url ? (
                  <img src={p.primary_photo_url} alt={p.pseudo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="h-16 w-16 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-primary truncate">{p.pseudo}</span>
                  <span className="text-sm text-muted-foreground">{ageFromBirthdate(p.birthdate)} ans</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{p.city || p.country || "—"}
                </div>
                {p.religious_practice && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-[color:var(--gold)]">
                    {PRACTICE_LABELS[p.religious_practice]}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}