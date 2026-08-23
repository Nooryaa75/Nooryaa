import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Star, Trash2 } from "lucide-react";
import { EDUCATION_LEVELS, OBJECTIVES, RELIGION_OPTIONS, COUNTRIES, CITIES, PROFESSIONS } from "@/lib/profile";
import { Link } from "@tanstack/react-router";
import { YesNoRadio } from "@/components/YesNoRadio";
import { ActivitiesPicker } from "@/components/ActivitiesPicker";


export const Route = createFileRoute("/_authenticated/me")({
  head: () => ({ meta: [{ title: "Mon profil — Nooryaa" }] }),
  component: MyProfile,
});

function MyProfile() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const { data: photos } = useQuery({
    queryKey: ["my-photos", ctx.userId],
    queryFn: async () => (await supabase.from("photos").select("*").eq("user_id", ctx.userId).order("position")).data ?? [],
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (profile && !form) setForm(profile); }, [profile, form]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        city: form.city, country: form.country, country_origin: form.country_origin,
        marital_status: form.marital_status,
        salat_quotidienne: form.salat_quotidienne ?? null,
        ramadan: form.ramadan ?? null,
        hadj: form.hadj ?? null,
        omra: form.omra ?? null,
        porte_voile: profile?.gender === "femme" ? (form.porte_voile ?? null) : null,
        has_children: form.has_children ?? null,
        children_count: form.has_children ? (Number(form.children_count) || null) : null,
        wants_children: form.wants_children ?? null,
        religion: form.religion,
        looking_for: profile?.gender === "homme" ? "femme" : "homme",
        bio: form.bio,
        profession: form.profession, education_level: form.education_level,
        activities: form.activities, objective: form.objective,
      }).eq("id", ctx.userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profil mis à jour"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadPhoto(file: File) {
    if (!photos) return;
    if (photos.length >= 6) { toast.error("Maximum 6 photos"); return; }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
    if (upErr) { toast.error(upErr.message); return; }
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!signed) { toast.error("URL non générée"); return; }
    const nextPos = (photos.reduce((m, p) => Math.max(m, p.position), 0) || 0) + 1;
    const { error } = await supabase.from("photos").insert({ user_id: ctx.userId, url: signed.signedUrl, storage_path: path, position: nextPos });
    if (error) { toast.error(error.message); return; }
    if (photos.length === 0) {
      await supabase.from("profiles").update({ primary_photo_url: signed.signedUrl }).eq("id", ctx.userId);
    }
    qc.invalidateQueries({ queryKey: ["my-photos"] });
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Photo ajoutée");
  }

  async function deletePhoto(photo: any) {
    await supabase.storage.from("profile-photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    if (profile?.primary_photo_url === photo.url) {
      const remaining = photos?.filter((p) => p.id !== photo.id) ?? [];
      await supabase.from("profiles").update({ primary_photo_url: remaining[0]?.url ?? null }).eq("id", ctx.userId);
    }
    qc.invalidateQueries({ queryKey: ["my-photos"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function makePrimary(photo: any) {
    await supabase.from("profiles").update({ primary_photo_url: photo.url }).eq("id", ctx.userId);
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success("Photo principale mise à jour");
  }

  if (!form) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="text-xs text-muted-foreground">
          <Link to="/blocked" className="underline underline-offset-4 hover:text-primary">Voir mes profils bloqués</Link>
        </div>
      </div>
      <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-serif text-primary mb-4">Mes photos ({photos?.length ?? 0}/6)</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {photos?.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-secondary">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              {profile?.primary_photo_url === p.url && (
                <div className="absolute top-1 left-1 bg-[color:var(--gold)] text-primary-foreground rounded-full p-1"><Star className="h-3 w-3 fill-current" /></div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {profile?.primary_photo_url !== p.url && (
                  <button onClick={() => makePrimary(p)} className="bg-white/90 rounded-full p-1.5"><Star className="h-4 w-4 text-primary" /></button>
                )}
                <button onClick={() => deletePhoto(p)} className="bg-white/90 rounded-full p-1.5"><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            </div>
          ))}
          {(photos?.length ?? 0) < 6 && (
            <button onClick={() => fileRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:bg-secondary/40 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
        <h2 className="text-xl font-serif text-primary">Mes informations</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Pseudo</Label><Input value={profile?.pseudo ?? ""} disabled /></div>
          <div><Label>Email</Label><Input value={profile?.email ?? ""} disabled /></div>
          <div>
            <Label>Profession</Label>
            <Select value={form.profession ?? ""} onValueChange={(v) => setForm({ ...form, profession: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ville / région</Label>
            <Select value={form.city ?? ""} onValueChange={(v) => setForm({ ...form, city: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pays de résidence</Label>
            <Select value={form.country ?? ""} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pays d'origine</Label>
            <Select value={form.country_origin ?? ""} onValueChange={(v) => setForm({ ...form, country_origin: v })}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Religion</Label>
            <Select value={form.religion ?? "Islam"} onValueChange={(v) => setForm({ ...form, religion: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Je cherche</Label>
            <Input value={profile?.gender === "homme" ? "Une femme" : "Un homme"} disabled />
          </div>
          <div>
            <Label>Situation</Label>
            <Select value={form.marital_status ?? ""} onValueChange={(v) => setForm({ ...form, marital_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="celibataire">Célibataire</SelectItem>
                <SelectItem value="divorce">Divorcé·e</SelectItem>
                <SelectItem value="veuf">Veuf·ve</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Enfants</Label>
            <YesNoRadio name="has_children" label="Avez-vous des enfants ?" value={form.has_children} onChange={(v) => setForm({ ...form, has_children: v, children_count: v ? form.children_count : null })} />
            {form.has_children === true && (
              <div>
                <Label htmlFor="children_count">Combien d'enfants ?</Label>
                <Select value={form.children_count ? String(form.children_count) : ""} onValueChange={(v) => setForm({ ...form, children_count: v ? Number(v) : null })}>
                  <SelectTrigger id="children_count"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <YesNoRadio name="wants_children" label="Souhaitez-vous avoir des enfants ?" value={form.wants_children} onChange={(v) => setForm({ ...form, wants_children: v })} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Pratique religieuse</Label>
            <YesNoRadio name="salat" label="Salat quotidienne" value={form.salat_quotidienne} onChange={(v) => setForm({ ...form, salat_quotidienne: v })} />
            <YesNoRadio name="ramadan" label="Ramadan" value={form.ramadan} onChange={(v) => setForm({ ...form, ramadan: v })} />
            <YesNoRadio name="hadj" label="Avez-vous fait le Hadj ?" value={form.hadj} onChange={(v) => setForm({ ...form, hadj: v })} />
            <YesNoRadio name="omra" label="Avez-vous fait la Omra ?" value={form.omra} onChange={(v) => setForm({ ...form, omra: v })} />
            {profile?.gender === "femme" && (
              <YesNoRadio name="voile" label="Portez-vous le voile ?" value={form.porte_voile} onChange={(v) => setForm({ ...form, porte_voile: v })} />
            )}
          </div>
          <div>
            <Label>Niveau d'études</Label>
            <Select value={form.education_level ?? ""} onValueChange={(v) => setForm({ ...form, education_level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Activités / centres d'intérêt (plusieurs choix possibles)</Label>
            <ActivitiesPicker value={form.activities} onChange={(v) => setForm({ ...form, activities: v })} />
          </div>

          <div className="md:col-span-2">
            <Label>Mon objectif sur Nooryaa</Label>
            <Select value={form.objective ?? ""} onValueChange={(v) => setForm({ ...form, objective: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>À propos</Label>
            <Textarea value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} maxLength={1000} />
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">Enregistrer</Button>
      </div>
    </div>
  );
}