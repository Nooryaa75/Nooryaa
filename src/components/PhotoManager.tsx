import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Star, Trash2, EyeOff, Eye, Loader2, ShieldCheck, Camera } from "lucide-react";
import { moderatePhoto } from "@/lib/photo-moderation.functions";
import { verifyPhotoIdentity } from "@/lib/photo-identity.functions";
import { CameraCapture } from "@/components/CameraCapture";
import { frenchError } from "@/lib/errors";


async function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("lecture du fichier impossible"));
    fr.readAsDataURL(file);
  });
}

async function toDataUrl(file: File, max = 768): Promise<string> {
  // Certains formats (HEIC iPhone, images exotiques) ne passent pas par createImageBitmap :
  // on tente le redimensionnement, puis on retombe sur une lecture directe.
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", 0.85);
    if (out.startsWith("data:image/") && out.length > 1000) return out;
  } catch (e) {
    console.warn("PhotoManager: redimensionnement impossible, lecture directe", e);
  }
  const raw = await readAsDataUrl(file);
  if (!raw.startsWith("data:image/")) throw new Error("format d'image non pris en charge");
  return raw;
}



const MAX_PHOTOS = 3;

export function PhotoManager({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const checkPhoto = useServerFn(moderatePhoto);
  const checkIdentity = useServerFn(verifyPhotoIdentity);

  // Web app : getUserMedia. Apps natives / navigateurs mobiles sans getUserMedia :
  // repli sur <input capture> qui ouvre l'appareil photo du téléphone.
  function openCamera() {
    const hasMedia = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;
    if (hasMedia) setCameraOpen(true);
    else captureRef.current?.click();
  }


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
    let identityWarning: string | null = null;
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

      // Contrôle d'identité : la nouvelle photo doit être la même personne que
      // les photos déjà validées et correspondre au sexe déclaré.
      const ident = await checkIdentity({ data: { imageDataUrl: dataUrl } });
      if (ident.verdict === "block") {
        toast.error(ident.reason || "Cette photo ne semble pas être vous et n'a pas été ajoutée.");
        return;
      }
      if (ident.verdict === "review") {
        toast.error(
          ident.reason ||
            "Nous n'avons pas pu confirmer que cette photo est bien vous. Refaites la vérification par selfie puis réessayez.",
        );
        return;
      }
      if (ident.require_selfie) {
        identityWarning =
          "Photo ajoutée : refaites la vérification par selfie pour retrouver votre badge « Vérifié ».";
      }
    } catch {
      toast.error("Le contrôle de la photo a échoué. Réessayez dans un instant.");
      return;
    } finally {
      setChecking(false);
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const authId = sessionData.session?.user?.id;
    if (!authId) {
      toast.error("Votre session a expiré. Reconnectez-vous puis réessayez.");
      return;
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${authId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
    if (upErr) {
      toast.error(
        /row-level security|policy|unauthorized/i.test(upErr.message)
          ? "Envoi refusé : votre session n'est plus valide. Reconnectez-vous puis réessayez."
          : upErr.message,
      );
      return;
    }
    const { data: signed } = await supabase.storage.from("profile-photos").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!signed) { toast.error("URL non générée"); return; }
    const nextPos = (photos.reduce((m, p) => Math.max(m, p.position), 0) || 0) + 1;
    const { error } = await supabase.from("photos").insert({ user_id: authId, url: signed.signedUrl, storage_path: path, position: nextPos });
    if (error) {
      toast.error(
        /row-level security|policy/i.test(error.message)
          ? "Enregistrement refusé : votre session n'est plus valide. Reconnectez-vous puis réessayez."
          : frenchError(error),
      );
      return;
    }

    if (photos.length === 0) {
      await supabase.from("profiles").update({ primary_photo_url: signed.signedUrl, primary_photo_blurred: false }).eq("id", userId);
    }
    refresh();
    if (identityWarning) toast.warning(identityWarning);
    else toast.success("Photo ajoutée");
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
    if (error) { toast.error(frenchError(error, "L'enregistrement de la photo a échoué.")); return; }
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
          <div key={p.id} className="flex flex-col gap-2">
            <div className="relative group aspect-square rounded-xl overflow-hidden bg-secondary">
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
                <button type="button" title="Supprimer" onClick={() => deletePhoto(p)} className="bg-white/90 rounded-full p-1.5"><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={p.blurred ?? false}
                onChange={() => toggleBlur(p)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Flouter cette photo
            </label>
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
      {/* Import depuis la galerie : liste MIME explicite (pas image/*) pour éviter que
          le navigateur mobile ouvre l'appareil photo au lieu de la photothèque. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
        multiple={false}
        hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPhoto(f); }}
      />
      <input ref={captureRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadPhoto(f); }} />
      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => uploadPhoto(f)} />

    </div>
  );
}
