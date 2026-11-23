// Conserve, dans un espace privé réservé à l'administration, l'image
// contrôlée par la modération (photo refusée ou douteuse), pour que
// l'équipe puisse la revoir dans le détail de l'événement.
export const MODERATION_MEDIA_BUCKET = "moderation-media";

export async function keepModerationImage(userId: string, dataUrl: string): Promise<string | null> {
  try {
    if (!dataUrl.startsWith("data:image/")) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base64 = dataUrl.split(",")[1] ?? "";
    if (!base64) return null;
    const mime = dataUrl.slice(5, dataUrl.indexOf(";")) || "image/jpeg";
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${userId}/${stamp}-${Math.random().toString(36).slice(2, 8)}`;
    const { error } = await supabaseAdmin.storage
      .from(MODERATION_MEDIA_BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) {
      console.error("moderation-media: conservation impossible", error);
      return null;
    }
    return path;
  } catch (e) {
    console.error("moderation-media: conservation impossible", e);
    return null;
  }
}
