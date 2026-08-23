import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EDUCATION_LEVELS, OBJECTIVES, RELIGION_OPTIONS, COUNTRIES, CITIES, PROFESSIONS, maxBirthdate, minBirthdate, isAdult } from "@/lib/profile";
import { YesNoRadio } from "@/components/YesNoRadio";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";
import { PhotoManager } from "@/components/PhotoManager";


export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Compléter mon profil — Nooryaa" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const ctx = Route.useRouteContext();
  const [form, setForm] = useState({
    pseudo: "",
    gender: "" as "homme" | "femme" | "",
    birthdate: "",
    city: "",
    country: "France",
    country_origin: "",
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
    objective: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [pseudoError, setPseudoError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", ctx.userId).maybeSingle().then(({ data }) => {
      if (data) setForm((f) => ({
        ...f,
        pseudo: data.pseudo && !data.pseudo.startsWith("user_") ? data.pseudo : "",
      }));
    });
  }, [ctx.userId]);

  async function checkPseudo(p: string) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(p)) {
      setPseudoError("3 à 20 caractères, lettres/chiffres/_/-");
      return false;
    }
    const { data } = await supabase.from("profiles").select("id").eq("pseudo", p).neq("id", ctx.userId).maybeSingle();
    if (data) { setPseudoError("Ce pseudo est déjà pris"); return false; }
    setPseudoError(null);
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(await checkPseudo(form.pseudo))) return;
    const missing: string[] = [];
    if (!form.pseudo) missing.push("Pseudo");
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
    if (!form.city) missing.push("Ville / région");
    if (!form.country) missing.push("Pays de résidence");
    if (!form.country_origin) missing.push("Pays d'origine");
    if (!form.profession) missing.push("Profession");
    if (!form.education_level) missing.push("Niveau d'études");
    if (!form.activities) missing.push("Activités / centres d'intérêt");
    if (form.smoker === null) missing.push("Fumez-vous");
    if (!form.objective) missing.push("Mon objectif sur Nooryaa");
    if (form.bio.length < 200 || form.bio.length > 500) missing.push("À propos (200 à 500 caractères)");
    if (missing.length > 0) {
      toast.error("Champs à compléter : " + missing.join(", ")); return;
    }
    if (!isAdult(form.birthdate)) {
      toast.error("Vous devez avoir au moins 18 ans pour vous inscrire."); return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      pseudo: form.pseudo,
      gender: form.gender,
      looking_for: form.gender === "homme" ? "femme" : "homme",
      birthdate: form.birthdate,
      city: form.city || null,
      country: form.country || null,
      country_origin: form.country_origin || null,
      marital_status: form.marital_status,
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
      objective: form.objective || null,
      bio: form.bio || null,
      onboarded: true,
    }).eq("id", ctx.userId);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil créé !");
    navigate({ to: "/me" });
  }

  return (
    <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 md:p-8 shadow-[var(--shadow-card)] border border-border/60">
      <h1 className="text-3xl font-serif text-primary mb-1">Votre profil Nooryaa</h1>
      <p className="text-muted-foreground text-sm mb-6">Tous les champs sont obligatoires pour finaliser votre profil.</p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="pseudo">Pseudo *</Label>
          <Input id="pseudo" value={form.pseudo} onChange={(e) => setForm({ ...form, pseudo: e.target.value })} onBlur={(e) => checkPseudo(e.target.value)} placeholder="amina_92" />
          {pseudoError && <p className="text-xs text-destructive mt-1">{pseudoError}</p>}
        </div>
        <div>
          <Label>Je suis *</Label>
          <Select value={form.gender} onValueChange={(v: any) => setForm({ ...form, gender: v })}>
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
            <Label>Situation *</Label>
            <Select value={form.marital_status} onValueChange={(v: any) => setForm({ ...form, marital_status: v })}>
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
            <Label>Ville / région *</Label>
            <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <Label>Activités / centres d'intérêt * (plusieurs choix possibles)</Label>
          <ActivitiesPicker value={form.activities} onChange={(v) => setForm({ ...form, activities: v })} />
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
          <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500 caractères minimum 200</p>
        </div>
        <div className="space-y-2 rounded-xl border border-border/60 p-4">
          <PhotoManager userId={ctx.userId} />
        </div>
        <Button type="submit" disabled={loading} size="lg" className="w-full rounded-full">
          {loading ? "Enregistrement..." : "Continuer"}
        </Button>
      </form>
    </div>
  );
}