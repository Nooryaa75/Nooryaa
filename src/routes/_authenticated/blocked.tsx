import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/blocked")({
  head: () => ({ meta: [{ title: "Profils bloqués — Noorya" }] }),
  component: BlockedList,
});

function BlockedList() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: blocks } = useQuery({
    queryKey: ["blocked-list", ctx.userId],
    queryFn: async () => {
      const { data: rows } = await supabase.from("blocks").select("id, blocked, created_at").eq("blocker", ctx.userId);
      if (!rows || rows.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, pseudo, primary_photo_url").in("id", rows.map((r) => r.blocked));
      return rows.map((r) => ({ ...r, profile: profs?.find((p) => p.id === r.blocked) })).filter((r) => r.profile);
    },
  });

  const unblock = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("blocks").delete().eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-list"] });
      toast.success("Profil débloqué");
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-serif text-primary">Profils bloqués</h1>
      <p className="text-sm text-muted-foreground">Ces personnes ne peuvent plus vous voir ni vous contacter.</p>
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
        {!blocks || blocks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Aucun profil bloqué.</div>
        ) : (
          blocks.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-4 border-b border-border/60 last:border-0">
              <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {b.profile?.primary_photo_url ? <img src={b.profile.primary_photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground" />}
              </div>
              <span className="font-medium text-primary flex-1">{b.profile?.pseudo}</span>
              <Button onClick={() => unblock.mutate(b.id)} variant="outline" size="sm">Débloquer</Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}