import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Star, Trash2, EyeOff, Eye, Loader2, ShieldCheck } from "lucide-react";
import { moderatePhoto } from "@/lib/photo-moderation.functions";

async function toDataUrl(file: File, max = 768): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}


const MAX_PHOTOS = 3;

export function PhotoManager({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const checkPhoto = useServerFn(moderatePhoto);

  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });

  const { data: photos } = useQuery({
    queryKey: ["my-photos", userId],
    queryFn: async () =>
      (await supabase.from("photos").select("*").eq("user_id", userId).order("position")).data ?? [],
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["my-photos"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function uploadPhoto(file: File) {
    if (!photos) return;
    if (photos.length >= MAX_PHOTOS) { toast.error(`Maximum ${MAX_PHOTOS} photos`); return; }

    setChecking(true);
    try {
      const dataUrl = await toDataUrl(file);
      const declaredAge = profile?.birthdate
        ? Math.floor((Date.now() - new Date(profile.birthdate).getTime()) / 31557600000)
        : null;
      const check = await checkPhoto({ data: { imageDataUrl: dataUrl, declaredAge } });
      if (check.verdict === "block") {
        toast.error(check.reason || "Cette photo ne respecte pas nos règles et n'a pas été ajoutée.");
        return;
      }
      if (check.verdict === "warn") {
        toast.warning(check.reason || "Photo acceptée mais signalée à la modération.");
      }
    } catch {
      // si la vérification échoue, on laisse passer l'envoi
    } finally {
      setChecking(false);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: false });
    if (upErr) { toast.error(upErr.message); return; }
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!signed) { toast.error("URL non générée"); return; }
    const nextPos = (photos.reduce((m, p) => Math.max(m, p.position), 0) || 0) + 1;
    const { error } = await supabase.from("photos").insert({ user_id: userId, url: signed.signedUrl, storage_path: path, position: nextPos });
    if (error) { toast.error(error.message); return; }
    if (photos.length === 0) {
      await supabase.from("profiles").update({ primary_photo_url: signed.signedUrl, primary_photo_blurred: false }).eq("id", userId);
    }
    refresh();
    toast.success("Photo ajoutée");
  }


  async function deletePhoto(photo: any) {
    await supabase.storage.from("profile-photos").remove([photo.storage_path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    if (profile?.primary_photo_url === photo.url) {
      const remaining = photos?.filter((p) => p.id !== photo.id) ?? [];
      await supabase.from("profiles").update({
        primary_photo_url: remaining[0]?.url ?? null,
        primary_photo_blurred: remaining[0]?.blurred ?? false,
      }).eq("id", userId);
    }
    refresh();
  }

  async function makePrimary(photo: any) {
    await supabase.from("profiles").update({ primary_photo_url: photo.url, primary_photo_blurred: photo.blurred ?? false }).eq("id", userId);
    refresh();
    toast.success("Photo principale mise à jour");
  }

  async function toggleBlur(photo: any) {
    const next = !photo.blurred;
    const { error } = await supabase.from("photos").update({ blurred: next }).eq("id", photo.id);
    if (error) { toast.error(error.message); return; }
    if (profile?.primary_photo_url === photo.url) {
      await supabase.from("profiles").update({ primary_photo_blurred: next }).eq("id", userId);
    }
    refresh();
    toast.success(next ? "Photo floutée" : "Floutage retiré");
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-xl font-serif text-primary">Mes photos ({photos?.length ?? 0}/{MAX_PHOTOS})</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Choisissez votre photo principale (étoile) et floutez-la si vous préférez rester discret·e (œil barré).
      </p>
      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--gold)]" />
        Chaque photo est vérifiée automatiquement (pudeur, image générée par IA, filtres excessifs, cohérence avec l'âge déclaré).
      </p>

      <div className="grid grid-cols-3 gap-3">
        {photos?.map((p: any) => (
          <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-secondary">
            <img src={p.url} alt="" className={`w-full h-full object-cover ${p.blurred ? "blur-md scale-110" : ""}`} />
            {profile?.primary_photo_url === p.url && (
              <div className="absolute top-1 left-1 bg-[color:var(--gold)] text-primary-foreground rounded-full p-1"><Star className="h-3 w-3 fill-current" /></div>
            )}
            {p.blurred && (
              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1"><EyeOff className="h-3 w-3" /></div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {profile?.primary_photo_url !== p.url && (
                <button type="button" title="Photo principale" onClick={() => makePrimary(p)} className="bg-white/90 rounded-full p-1.5"><Star className="h-4 w-4 text-primary" /></button>
              )}
              <button type="button" title={p.blurred ? "Retirer le flou" : "Flouter"} onClick={() => toggleBlur(p)} className="bg-white/90 rounded-full p-1.5">
                {p.blurred ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-primary" />}
              </button>
              <button type="button" title="Supprimer" onClick={() => deletePhoto(p)} className="bg-white/90 rounded-full p-1.5"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
        {(photos?.length ?? 0) < MAX_PHOTOS && (
          <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 p-2">
            {checking ? (
              <>
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                <span className="text-[10px] text-muted-foreground">Vérification…</span>
              </>
            ) : (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-secondary/40 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Importer</span>
                </button>
                <button type="button" onClick={openCamera} className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-secondary/40 transition-colors">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Prendre une photo</span>
                </button>
              </>
            )}
          </div>
        )}

      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPhoto(f); }} />
      <input ref={captureRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPhoto(f); }} />
      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => uploadPhoto(f)} />

    </div>
  );
}
