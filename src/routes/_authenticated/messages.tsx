import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { MessageCircle, User, MoreVertical, Trash2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Nooryaa" }] }),
  component: MessagesLayout,
});

function MessagesLayout() {
  const ctx = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/messages";
  const qc = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; pseudo: string } | null>(null);
  const [reportOpen, setReportOpen] = useState<{ id: string; pseudo: string } | null>(null);
  const [reportReason, setReportReason] = useState("");

  const { data: convos } = useQuery({
    queryKey: ["conversations", ctx.userId],
    queryFn: async () => {
      // Toute personne avec qui j'ai échangé un message OU à qui j'ai envoyé un coup de cœur
      const [{ data: sent }, { data: received }, { data: likes }, { data: iBlock }, { data: blockedMe }] = await Promise.all([
        supabase.from("messages").select("receiver, hidden_for").eq("sender", ctx.userId),
        supabase.from("messages").select("sender, hidden_for").eq("receiver", ctx.userId),
        supabase.from("likes").select("to_user").eq("from_user", ctx.userId),
        supabase.from("blocks").select("blocked").eq("blocker", ctx.userId),
        supabase.from("blocks").select("blocker").eq("blocked", ctx.userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
      ]);
      // Une conversation supprimée de mon côté n'apparaît plus dans la liste
      const visible = new Set<string>();
      const hiddenOnly = new Set<string>();
      for (const [rows, key] of [[sent ?? [], "receiver"], [received ?? [], "sender"]] as const) {
        for (const r of rows as any[]) {
          const peerId = r[key];
          if (((r.hidden_for ?? []) as string[]).includes(ctx.userId)) hiddenOnly.add(peerId);
          else visible.add(peerId);
        }
      }
      for (const id of visible) hiddenOnly.delete(id);
      const ids = new Set<string>([
        ...visible,
        ...(likes ?? []).map((r) => r.to_user).filter((id) => !hiddenOnly.has(id)),
      ]);
      const filtered = [...ids].filter((id) => !excluded.has(id));
      if (filtered.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, pseudo, primary_photo_url").in("id", filtered);
      return profs ?? [];
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (peerId: string) => {
      const { data: rows } = await supabase.from("messages").select("id, hidden_for")
        .or(`and(sender.eq.${ctx.userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${ctx.userId})`);
      for (const m of rows ?? []) {
        const hidden: string[] = [...((m as any).hidden_for ?? [])];
        if (hidden.includes(ctx.userId)) continue;
        hidden.push(ctx.userId);
        await supabase.from("messages").update({ hidden_for: hidden } as any).eq("id", m.id);
      }
    },
    onSuccess: () => {
      toast.success("Conversation supprimée");
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reportAbuse = useMutation({
    mutationFn: async () => {
      if (!reportOpen) return;
      const { error } = await supabase.from("reports").insert({
        reporter: ctx.userId,
        reported: reportOpen.id,
        reason: reportReason.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signalement envoyé à la modération");
      setReportOpen(null);
      setReportReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
      <aside className={`bg-card rounded-2xl border border-border/60 overflow-hidden ${isDetail ? "hidden md:block" : ""}`}>
        <div className="p-4 border-b border-border/60"><h2 className="font-serif text-primary">Conversations</h2></div>
        <div className="overflow-y-auto h-full">
          {!convos || convos.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto h-8 w-8 mb-2" />
              Aucune conversation pour le moment. Cliquez sur un profil pour démarrer.
            </div>
          ) : convos.map((p) => (
            <div key={p.id} className={`group flex items-center gap-2 px-3 py-3 hover:bg-secondary/50 ${pathname.endsWith(`/${p.pseudo}`) ? "bg-secondary" : ""}`}>
              <Link to="/messages/$pseudo" params={{ pseudo: p.pseudo }} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                  {p.primary_photo_url ? <img src={p.primary_photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground" />}
                </div>
                <span className="font-medium text-primary truncate">{p.pseudo}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Options pour ${p.pseudo}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setReportOpen({ id: p.id, pseudo: p.pseudo }); }}>
                    <Flag className="h-4 w-4 mr-2" /> Signaler en cas d'abus
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete({ id: p.id, pseudo: p.pseudo })}>
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer la conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </aside>
      <section className={`bg-card rounded-2xl border border-border/60 overflow-hidden ${!isDetail ? "hidden md:flex" : "flex"} flex-col`}>
        {isDetail ? <Outlet /> : (
          <div className="m-auto text-muted-foreground text-center">
            <MessageCircle className="mx-auto h-10 w-10 mb-2" />
            Sélectionnez une conversation
          </div>
        )}
      </section>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle disparaîtra de votre messagerie. Votre correspondant·e conservera sa copie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteConversation.mutate(confirmDelete.id)}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reportOpen} onOpenChange={(open) => !open && setReportOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signaler {reportOpen?.pseudo}</AlertDialogTitle>
            <AlertDialogDescription>
              Décrivez brièvement l'abus constaté. Notre équipe de modération examinera le signalement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Propos déplacés, harcèlement, arnaque…"
            maxLength={500}
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportOpen(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={reportReason.trim().length < 10 || reportAbuse.isPending}
              onClick={(e) => { e.preventDefault(); reportAbuse.mutate(); }}
            >
              Envoyer le signalement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}