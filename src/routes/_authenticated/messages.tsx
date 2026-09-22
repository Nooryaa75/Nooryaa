import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, User, MoreVertical, Trash2, Flag, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";
import { useMyProfile } from "@/lib/match";
import { useLikeGraph, isBlurred } from "@/lib/reveal";
import { useI18n, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Nooryaa" },
      { name: "description", content: "Retrouvez vos conversations et échangez avec vos matchs sur Nooryaa." },
      { property: "og:title", content: "Messages — Nooryaa" },
      { property: "og:description", content: "Retrouvez vos conversations et échangez avec vos matchs sur Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesLayout,
});

type Convo = {
  id: string;
  pseudo: string;
  primary_photo_url: string | null;
  primary_photo_blurred: boolean;
  lastText: string;
  lastAt: string | null;
  lastIsMine: boolean;
  unread: number;
  liked: boolean;
};

function formatWhen(iso: string | null, locale: Locale, yesterday: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const languageTag = locale === "ar" ? "ar" : locale === "en" ? "en-GB" : "fr-FR";
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString(languageTag, { hour: "2-digit", minute: "2-digit" });
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (diff < 2) return yesterday;
  if (diff < 7) return d.toLocaleDateString(languageTag, { weekday: "short" });
  return d.toLocaleDateString(languageTag, { day: "2-digit", month: "2-digit" });
}

/** Présence en ligne partagée (point vert à côté du prénom). */
function useOnlineUsers(userId: string) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    const channel = supabase.channel("nooryaa-presence", { config: { presence: { key: userId } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ at: Date.now() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
  return online;
}

function MessagesLayout() {
  const ctx = Route.useRouteContext();
  const { locale, t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/messages";
  const qc = useQueryClient();
  const online = useOnlineUsers(ctx.userId);
  const { data: me } = useMyProfile(ctx.userId);
  const { data: likeGraph } = useLikeGraph(ctx.userId);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; pseudo: string } | null>(null);
  const [reportOpen, setReportOpen] = useState<{ id: string; pseudo: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"tous" | "nonlus" | "favoris">("tous");

  const { data: convos } = useQuery({
    queryKey: ["conversations", ctx.userId, locale],
    refetchInterval: 60_000,
    queryFn: async (): Promise<Convo[]> => {
      const [{ data: msgs }, { data: likes }, { data: iBlock }, { data: blockedMe }, { data: hiddenConvos }] = await Promise.all([
        supabase.from("messages").select("sender, receiver, content, image_path, audio_path, created_at, read_at, deleted_at, hidden_for")
          .or(`sender.eq.${ctx.userId},receiver.eq.${ctx.userId}`)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("to_user").eq("from_user", ctx.userId),
        supabase.from("blocks").select("blocked").eq("blocker", ctx.userId),
        supabase.from("blocks").select("blocker").eq("blocked", ctx.userId),
        supabase.from("conversation_hides").select("peer_id").eq("user_id", ctx.userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
        ...((hiddenConvos ?? []) as Array<{ peer_id: string }>).map((r) => r.peer_id),
      ]);
      const likedIds = new Set((likes ?? []).map((r) => r.to_user));

      const byPeer = new Map<string, { last: any; unread: number; visible: boolean }>();
      for (const m of (msgs ?? []) as any[]) {
        const peerId = m.sender === ctx.userId ? m.receiver : m.sender;
        const hidden = ((m.hidden_for ?? []) as string[]).includes(ctx.userId);
        const entry = byPeer.get(peerId) ?? { last: null, unread: 0, visible: false };
        if (!hidden) {
          entry.visible = true;
          if (!entry.last) entry.last = m;
          if (m.receiver === ctx.userId && !m.read_at && !m.deleted_at) entry.unread += 1;
        }
        byPeer.set(peerId, entry);
      }

      const ids = new Set<string>([...byPeer.keys(), ...likedIds]);
      const filtered = [...ids].filter((id) => !excluded.has(id) && (byPeer.get(id)?.visible || likedIds.has(id)));
      if (filtered.length === 0) return [];

      const { data: profs } = await supabase.from("profiles").select("id, pseudo, primary_photo_url, primary_photo_blurred").in("id", filtered);
      return (profs ?? []).map((p) => {
        const e = byPeer.get(p.id);
        const last = e?.last;
        const lastText = !last
          ? t("Démarrez la conversation")
          : last.audio_path
            ? `🎤 ${t("Message vocal")}`
            : last.image_path
              ? `📷 ${t("Photo")}`
              : (last.content as string) ?? "";
        return {
          id: p.id,
          pseudo: p.pseudo,
          primary_photo_url: p.primary_photo_url,
          primary_photo_blurred: !!p.primary_photo_blurred,
          lastText,
          lastAt: last?.created_at ?? null,
          lastIsMine: last?.sender === ctx.userId,
          unread: e?.unread ?? 0,
          liked: likedIds.has(p.id),
        };
      }).sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
    },
  });

  // Mise à jour instantanée de la liste dès qu'un message arrive ou part
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        qc.invalidateQueries({ queryKey: ["conversations", ctx.userId] });
      }, 300);
    };
    const channel = supabase
      .channel(`convos-${ctx.userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver=eq.${ctx.userId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `sender=eq.${ctx.userId}` }, refresh)
      .subscribe();
    return () => { if (timer) clearTimeout(timer); supabase.removeChannel(channel); };
  }, [ctx.userId, qc]);

  const visible = useMemo(() => {
    let list = convos ?? [];
    if (tab === "nonlus") list = list.filter((c) => c.unread > 0);
    if (tab === "favoris") list = list.filter((c) => c.liked);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => c.pseudo.toLowerCase().includes(q));
    return list;
  }, [convos, tab, search]);

  const deleteConversation = useMutation({
    mutationFn: async (peerId: string) => {
      const { error: hideError } = await supabase.from("conversation_hides").upsert(
        { user_id: ctx.userId, peer_id: peerId } as any,
        { onConflict: "user_id,peer_id" },
      );
      if (hideError) throw hideError;

      const { data: rows } = await supabase.from("messages").select("id, hidden_for")
        .or(`and(sender.eq.${ctx.userId},receiver.eq.${peerId}),and(sender.eq.${peerId},receiver.eq.${ctx.userId})`);
      for (const m of rows ?? []) {
        const hidden: string[] = [...((m as any).hidden_for ?? [])];
        if (hidden.includes(ctx.userId)) continue;
        hidden.push(ctx.userId);
        const { error } = await supabase.from("messages").update({ hidden_for: hidden } as any).eq("id", m.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("Conversation supprimée"));
      if (confirmDelete) {
        qc.setQueryData(["conversations", ctx.userId], (old: any) => Array.isArray(old) ? old.filter((p) => p.id !== confirmDelete.id) : old);
      }
      setConfirmDelete(null);
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
    },
    onError: (e: any) => toast.error(frenchError(e)),
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
      toast.success(t("Signalement envoyé à la modération"));
      setReportOpen(null);
      setReportReason("");
    },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const tabs = [
    { key: "tous", label: "Tous" },
    { key: "nonlus", label: "Non lus" },
    { key: "favoris", label: "Favoris" },
  ] as const;

  return (
    <div className={isDetail ? "" : "-mt-2"}>
      {/* En-tête de page façon maquette */}
      {!isDetail && (
        <div className="text-center mb-6">
          <Heart className="mx-auto h-8 w-8 text-accent fill-accent mb-3" />
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-primary">Liste des conversations</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Retrouvez tous vos matchs<br />et conversations au même endroit.
          </p>
        </div>
      )}

      <div className={`grid ${isDetail ? "md:grid-cols-[340px_1fr]" : "max-w-md mx-auto"} gap-4 ${isDetail ? "h-[calc(100vh-200px)]" : ""}`}>
        <aside className={`bg-card rounded-[2rem] border border-border/50 overflow-hidden flex flex-col shadow-md ${isDetail ? "hidden md:flex h-full" : "flex h-[70vh]"}`}>
          {/* En-tête carte */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Messages</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" aria-label="Options des messages">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTab("nonlus")}>Voir les non lus</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTab("favoris")}>Voir les favoris</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Recherche */}
          <div className="px-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un message"
                className="pl-10 rounded-full bg-muted/60 border-transparent focus-visible:ring-accent h-10"
              />
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-2 px-5 pt-4 pb-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1 mt-1 pb-3">
            {visible.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto h-8 w-8 mb-2 text-accent" />
                {search || tab !== "tous"
                  ? "Aucune conversation ne correspond."
                  : "Aucune conversation pour le moment. Cliquez sur un profil pour démarrer."}
              </div>
            ) : visible.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/60 ${pathname.endsWith(`/${p.pseudo}`) ? "bg-secondary" : ""}`}
              >
                <Link to="/messages/$pseudo" params={{ pseudo: p.pseudo }} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-secondary">
                    {p.primary_photo_url ? <img src={p.primary_photo_url} alt="" className={`w-full h-full object-cover ${isBlurred(p as any, me as any, likeGraph) ? "blur-md scale-110" : ""}`} /> : <User className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="truncate">{p.pseudo}</span>
                      {online.has(p.id) && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-label="En ligne" />}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                      {p.lastIsMine && `${t("Vous")} : `}{p.lastText}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-muted-foreground">{formatWhen(p.lastAt, locale, t("Hier"))}</span>
                  {p.unread > 0 ? (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                      {p.unread}
                    </span>
                  ) : <span className="h-5" />}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Options pour ${p.pseudo}`}>
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

        {isDetail && (
          <section className="bg-card rounded-3xl border border-border/60 overflow-hidden flex flex-col">
            <Outlet />
          </section>
        )}
      </div>

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
