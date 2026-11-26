import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function cleanupConversations(dryRun = false) {
  const { data, error } = await supabaseAdmin.rpc("purge_inactive_conversations", { dry_run: dryRun });
  if (error) throw new Error(error.message);
  if (dryRun) return { result: data, filesRemoved: 0 };

  let filesRemoved = 0;
  // Bounded file batches; failed entries remain durable for the next daily run.
  for (let batch = 0; batch < 20; batch++) {
    const { data: queued, error: queueError } = await supabaseAdmin
      .from("conversation_media_cleanup").select("id,bucket,path")
      .order("created_at").order("id").limit(100);
    if (queueError) throw new Error(queueError.message);
    if (!queued?.length) break;
    for (const bucket of ["message-photos", "message-audio"]) {
      const rows = queued.filter((row) => row.bucket === bucket);
      if (!rows.length) continue;
      // Never remove a file still referenced by another, active exchange.
      const field = bucket === "message-photos" ? "image_path" : "audio_path";
      const { data: referenced, error: readError } = await supabaseAdmin
        .from("messages").select("image_path,audio_path").in(field, rows.map((row) => row.path));
      if (readError) throw new Error(readError.message);
      const used = new Set(referenced?.map((row) => row[field]));
      const paths = rows.filter((row) => !used.has(row.path)).map((row) => row.path);
      if (paths.length) {
        const { error: storageError } = await supabaseAdmin.storage.from(bucket).remove(paths);
        if (storageError) throw new Error(storageError.message);
        filesRemoved += paths.length;
      }
      const { error: acknowledgeError } = await supabaseAdmin.from("conversation_media_cleanup")
        .delete().in("id", rows.map((row) => row.id));
      if (acknowledgeError) throw new Error(acknowledgeError.message);
    }
  }
  return { result: data, filesRemoved };
}