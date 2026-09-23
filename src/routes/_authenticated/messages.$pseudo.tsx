import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ImagePlus, Loader2, MoreVertical, Pencil, Trash2, Reply, X, Check, CheckCheck, Flag, ShieldCheck, Plus, Ban } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { notifyByEmail } from "@/lib/notify";
import { useServerFn } from "@tanstack/react-start";
import { moderateMessage, moderateVoice } from "@/lib/moderation.functions";
import { lexiconCheck } from "@/lib/moderation-rules";
import { EmojiPicker } from "@/components/EmojiPicker";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { PrayerChatNotice } from "@/components/PrayerChatNotice";
import { useMyProfile } from "@/lib/match";
import { useLikeGraph, canMessage, isBlurred, MESSAGE_BLOCKED_HINT } from "@/lib/reveal";
import { useI18n } from "@/lib/i18n";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/messages/$pseudo")({
  head: ({ params }) => ({ meta: [{ title: `Chat avec ${params.pseudo} — Nooryaa` }] }),
  component: Conversation,
});

function Conversation() {
  const { pseudo } = Route.useParams();
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannel = useRef<any>(null);
  const lastTypingSent = useRef(0);

  const { data: peer } = useQuery({
    queryKey: ["peer", pseudo],
    queryFn: async () => (await supabase.from("profiles").select("id, pseudo, primary_photo_url, primary_photo_blurred, gender").eq("pseudo", pseudo).single()).data,
  });

  const { data: me } = useMyProfile(ctx.userId);
  const { data: likeGraph } = useLikeGraph(ctx.userId);
  const messagingAllowed = canMessage(me, peer, likeGraph);
  const peerBlurred = isBlurred(peer as any, me as any, likeGraph);
  const peerAvatarClass = `w-full h-full object-cover ${peerBlurred ? "blur-md scale-110" : ""}`;

  // Cache des URL signées : évite de re-signer les pièces jointes à chaque rafraîchissement
  const urlCache = useRef(new Map<string, string>());
  async function signedUrl(bucket: string, path: string) {
    const key = `${bucket}:${path}`;
    const hit = urlCache.current.get(key);
    if (hit) return hit;
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (data?.signedUrl) urlCache.current.set(key, data.signedUrl);
    return data?.signedUrl;
  }

  async function decorate(m: any) {
    if (m.deleted_at) return m;
    let out = m;
    if (m.image_path) out = { ...out, image_url: await signedUrl("message-photos", m.image_path) };
    if (m.audio_path) out = { ...out, audio_url: await signedUrl("message-audio", m.audio_path) };
    return out;
  }

  const msgKey = ["messages", ctx.userId, peer?.id];

  function patchList(updater: (old: any[]) => any[]) {
    qc.setQueryData(msgKey, (old: any) => updater(Array.isArray(old) ? old : []));
  }

  const { data: messages } = useQuery({
    queryKey: msgKey,
    enabled: !!peer,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender.eq.${ctx.userId},receiver.eq.${peer!.id}),and(sender.eq.${peer!.id},receiver.eq.${ctx.userId})`)
        .order("created_at");
      const rows = (data ?? []).filter((m: any) => !(m.hidden_for ?? []).includes(ctx.userId));
      return await Promise.all(rows.map(decorate));
    },
  });

  // Marque comme lus les messages reçus dès l'ouverture (et à chaque nouveau message).
  const unreadIds = (messages ?? [])
    .filter((m: any) => m.receiver === ctx.userId && !m.read_at && !m.deleted_at && !m.pending)
    .map((m: any) => m.id)
    .join(",");
  useEffect(() => {
    if (!unreadIds) return;
    const ids = unreadIds.split(",");
    const now = new Date().toISOString();
    (async () => {
      const { error } = await supabase.from("messages").update({ read_at: now } as any).in("id", ids);
      if (error) return;
      patchList((old) => old.map((m) => (ids.includes(m.id) ? { ...m, read_at: now } : m)));
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadIds]);

  // Temps réel : on applique directement la modification reçue, sans recharger toute la conversation

  useEffect(() => {
    if (!peer) return;
    const apply = async (row: any, event: string) => {
      if (!row) return;
      const mine = row.sender === ctx.userId && row.receiver === peer.id;
      const theirs = row.sender === peer.id && row.receiver === ctx.userId;
      if (!mine && !theirs) return;
      if (event === "DELETE" || (row.hidden_for ?? []).includes(ctx.userId)) {
        patchList((old) => old.filter((m) => m.id !== row.id));
        return;
      }
      const dec = await decorate(row);
      patchList((old) => {
        const next = old.filter(
          (m) => m.id !== dec.id && !(m.pending && m.sender === dec.sender && m.content === dec.content),
        );
        return [...next, dec].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      });
      if (theirs) qc.invalidateQueries({ queryKey: ["unread-counts"] });
    };
    const channel = supabase
      .channel(`conv-${[ctx.userId, peer.id].sort().join("-")}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `sender=eq.${peer.id}` },
        (p: any) => apply(p.new ?? p.old, p.eventType))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `sender=eq.${ctx.userId}` },
        (p: any) => apply(p.new ?? p.old, p.eventType))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [peer, ctx.userId, qc]);

  // Indicateur « en train d'écrire » via un canal temps réel partagé
  useEffect(() => {
    if (!peer) return;
    const key = [ctx.userId, peer.id].sort().join("-");
    const ch = supabase.channel(`typing-${key}`, { config: { broadcast: { self: false } } });
    let timer: ReturnType<typeof setTimeout>;
    ch.on("broadcast", { event: "typing" }, (payload: any) => {
      if (payload.payload?.from !== peer.id) return;
      setPeerTyping(true);
      clearTimeout(timer);
      timer = setTimeout(() => setPeerTyping(false), 3000);
    }).subscribe();
    typingChannel.current = ch;
    return () => { clearTimeout(timer); supabase.removeChannel(ch); typingChannel.current = null; };
  }, [peer, ctx.userId]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 1200) return;
    lastTypingSent.current = now;
    typingChannel.current?.send({ type: "broadcast", event: "typing", payload: { from: ctx.userId } });
  }

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, peerTyping]);

  const moderate = useServerFn(moderateMessage);
  const moderateVoiceFn = useServerFn(moderateVoice);

  // Analyse automatique en arrière-plan : le message part tout de suite,
  // il est retiré immédiatement s'il enfreint la charte.
  function moderateInBackground(content: string, messageId: string) {
    void (async () => {
      try {
        const res = await moderate({ data: { content, targetUserId: peer!.id } });
        if (res.verdict === "block") {
          await supabase.from("messages")
            .update({ deleted_at: new Date().toISOString(), content: null } as any)
            .eq("id", messageId);
          patchList((old) => old.filter((m) => m.id !== messageId));
          toast.error(res.reason ? t(res.reason) : t("Ce message ne respecte pas la charte de Nooryaa."));
        } else if (res.verdict === "warn" && res.reason) {
          toast.warning(res.reason);
        }
      } catch {
        // analyse indisponible : le filtre local a déjà été appliqué
      }
    })();
  }

  const send = useMutation({
    mutationFn: async (payload: { content: string; editingId: string | null; replyToId: string | null }) => {
      if (!peer) return;
      const { content, editingId, replyToId } = payload;
      const local = lexiconCheck(content);
      if (local.verdict === "block") throw new Error(local.reason);
      if (local.verdict === "warn" && local.reason) toast.warning(local.reason);

      if (editingId) {
        const editedAt = new Date().toISOString();
        patchList((old) => old.map((m) => (m.id === editingId ? { ...m, content, edited_at: editedAt } : m)));
        const { error } = await supabase.from("messages")
          .update({ content, edited_at: editedAt } as any)
          .eq("id", editingId);
        if (error) throw error;
        moderateInBackground(content, editingId);
        return;
      }

      const tempId = `tmp-${crypto.randomUUID()}`;
      patchList((old) => [...old, {
        id: tempId, sender: ctx.userId, receiver: peer.id, content,
        created_at: new Date().toISOString(), reply_to: replyToId, pending: true,
      }]);
      const { data: inserted, error } = await supabase.from("messages").insert({
        sender: ctx.userId, receiver: peer.id, content,
        ...(replyToId ? { reply_to: replyToId } : {}),
      } as any).select().single();
      if (error) {
        patchList((old) => old.filter((m) => m.id !== tempId));
        throw error;
      }
      patchList((old) => {
        const withoutDup = old.filter((m) => m.id !== tempId && m.id !== inserted.id);
        return [...withoutDup, inserted];
      });
      notifyByEmail("message", peer.id, content);
      moderateInBackground(content, inserted.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  function submitMessage() {
    const content = text.trim();
    if (!peer || !content) return;
    const editingId = editing?.id ?? null;
    const replyToId = replyTo?.id ?? null;
    setText(""); setReplyTo(null); setEditing(null);
    send.mutate({ content, editingId, replyToId });
  }

  const removeMessage = useMutation({
    mutationFn: async (m: any) => {
      const deletedAt = new Date().toISOString();
      patchList((old) => old.map((x) => (x.id === m.id ? { ...x, deleted_at: deletedAt, content: null, image_url: null, audio_url: null } : x)));
      const { error } = await supabase.from("messages")
        .update({ deleted_at: deletedAt, content: null, image_path: null, audio_path: null } as any)
        .eq("id", m.id);
      if (error) throw error;
      // Supprime aussi les fichiers du stockage (photo / vocal)
      if (m.image_path) await supabase.storage.from("message-photos").remove([m.image_path]);
      if (m.audio_path) await supabase.storage.from("message-audio").remove([m.audio_path]);
    },
    onSuccess: () => { toast.success(t("Message supprimé")); qc.invalidateQueries({ queryKey: ["unread-counts"] }); },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const deleteConversation = useMutation({
    mutationFn: async () => {
      if (!peer) return;
      const { error: hideError } = await supabase.from("conversation_hides").upsert(
        { user_id: ctx.userId, peer_id: peer.id } as any,
        { onConflict: "user_id,peer_id" },
      );
      if (hideError) throw hideError;

      for (const m of messages ?? []) {
        const hidden: string[] = [...((m as any).hidden_for ?? [])];
        if (hidden.includes(ctx.userId)) continue;
        hidden.push(ctx.userId);
        const { error } = await supabase.from("messages").update({ hidden_for: hidden } as any).eq("id", m.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("Conversation supprimée"));
      setConfirmDeleteConvo(false);
      if (peer) {
        qc.setQueryData(["conversations", ctx.userId], (old: any) => Array.isArray(old) ? old.filter((p) => p.id !== peer.id) : old);
      }
      qc.invalidateQueries({ queryKey: ["messages"] }); qc.invalidateQueries({ queryKey: ["unread-counts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/messages" });
    },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const reportAbuse = useMutation({
    mutationFn: async () => {
      if (!peer) return;
      const { error } = await supabase.from("reports").insert({
        reporter: ctx.userId,
        reported: peer.id,
        reason: reportReason.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Signalement envoyé à la modération"));
      setReportOpen(false);
      setReportReason("");
    },
    onError: (e: any) => toast.error(frenchError(e)),
  });



  const blockPeer = useMutation({
    mutationFn: async () => {
      if (!peer) return;
      const { error } = await supabase.from("blocks").insert({ blocker: ctx.userId, blocked: peer.id } as any);
      if (error) throw error;
      await supabase.from("likes").delete().eq("from_user", ctx.userId).eq("to_user", peer.id);
    },
    onSuccess: () => {
      toast.success(t("Profil bloqué"));
      qc.invalidateQueries({ queryKey: ["block"] });
      qc.invalidateQueries({ queryKey: ["browse"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/messages" });
    },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  async function handlePhoto(file: File) {
    if (!peer) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("Photo trop lourde (max 5 Mo)")); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("message-photos").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: inserted, error } = await supabase.from("messages").insert({
        sender: ctx.userId, receiver: peer.id, image_path: path,
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      } as any).select().single();
      if (error) throw error;
      // Aperçu local immédiat, sans attendre l'URL signée
      patchList((old) => [...old.filter((m) => m.id !== inserted.id), { ...inserted, image_url: URL.createObjectURL(file) }]);
      notifyByEmail("message", peer.id, "Photo");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch (e: any) {
      toast.error(frenchError(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleVoice(blob: Blob, duration: number) {
    if (!peer) return;
    if (blob.size > 10 * 1024 * 1024) { toast.error(t("Vocal trop lourd (max 10 Mo)")); return; }
    setSendingVoice(true);
    try {
      const ext = blob.type.includes("wav") ? "wav" : blob.type.includes("mp4") ? "m4a" : "webm";
      const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("message-audio").upload(path, blob, { contentType: blob.type });
      if (upErr) throw upErr;

      const { data: inserted, error } = await supabase.from("messages").insert({
        sender: ctx.userId, receiver: peer.id, audio_path: path, audio_duration: duration,
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      } as any).select().single();
      if (error) throw error;
      // Lecture immédiate depuis l'enregistrement local
      patchList((old) => [...old.filter((m) => m.id !== inserted.id), { ...inserted, audio_url: URL.createObjectURL(blob) }]);
      notifyByEmail("message", peer.id, "Message vocal");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });

      // Modération du vocal en arrière-plan : retiré aussitôt s'il enfreint la charte
      void (async () => {
        try {
          const res = await moderateVoiceFn({ data: { audioPath: path, mimeType: blob.type, targetUserId: peer.id } });
          if (res.verdict === "block") {
            await supabase.from("messages")
              .update({ deleted_at: new Date().toISOString(), audio_path: null } as any)
              .eq("id", inserted.id);
            await supabase.storage.from("message-audio").remove([path]);
            patchList((old) => old.filter((m) => m.id !== inserted.id));
            toast.error(res.reason ? t(res.reason) : t("Ce vocal ne respecte pas la charte de Nooryaa."));
          } else if (res.verdict === "warn" && res.reason) {
            toast.warning(res.reason);
          }
        } catch {
          // analyse indisponible : on laisse passer le vocal
        }
      })();
    } catch (e: any) {
      toast.error(frenchError(e));
    } finally {
      setSendingVoice(false);
    }
  }


  if (!peer) return <div className="m-auto text-muted-foreground">{t("Chargement")}...</div>;

  const byId = new Map((messages ?? []).map((m: any) => [m.id, m]));

  return (
    <>
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <Link to="/messages" className="text-primary"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/profile/$pseudo" params={{ pseudo: peer.pseudo }} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden shrink-0">
            {peer.primary_photo_url && <img src={peer.primary_photo_url} alt="" className={peerAvatarClass} />}
          </div>
          <span className="min-w-0">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span className="truncate">{peer.pseudo}</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            </span>
            <span className="text-xs text-muted-foreground block">{peerTyping ? t("est en train d'écrire…") : t("En ligne")}</span>
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("Options de la conversation")}><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-2" /> {t("Signaler en cas d'abus")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmBlock(true)}>
              <Ban className="h-4 w-4 mr-2" /> {t("Bloquer")} {peer.pseudo}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDeleteConvo(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> {t("Supprimer la conversation")}
            </DropdownMenuItem>
          </DropdownMenuContent>

        </DropdownMenu>
      </div>
      <PrayerChatNotice />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Bandeau sécurité */}
        <div className="mx-1 rounded-2xl bg-secondary px-4 py-3 flex gap-3 items-start">
          <ShieldCheck className="h-8 w-8 text-accent shrink-0" />
          <div>
            <p className="text-sm font-bold text-accent">{t("Votre sécurité est notre priorité")}</p>
            <p className="text-xs text-foreground/80">{t("Ne partagez jamais d'informations personnelles.")}</p>
            <Link to="/compte/regles" className="text-xs font-semibold text-primary underline underline-offset-2">{t("En savoir plus")}</Link>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground py-1">{t("Aujourd'hui")}</p>
        {messages?.map((m: any) => {
          const mine = m.sender === ctx.userId;
          const parent = m.reply_to ? byId.get(m.reply_to) : null;
          return (
            <div key={m.id} className={`flex items-end gap-2 group ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && (
                <div className="h-8 w-8 rounded-full bg-secondary overflow-hidden shrink-0">
                  {peer.primary_photo_url && <img src={peer.primary_photo_url} alt="" className={peerAvatarClass} />}
                </div>
              )}
              {mine && !m.deleted_at && (
                <div className={`transition-opacity flex gap-1 ${actionFor === m.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                   <button type="button" title={t("Répondre")} onClick={() => { setReplyTo(m); setEditing(null); setActionFor(null); }} className="text-muted-foreground hover:text-primary"><Reply className="h-4 w-4" /></button>
                  {m.content && (
                     <button type="button" title={t("Modifier")} onClick={() => { setEditing(m); setReplyTo(null); setText(m.content); setActionFor(null); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  )}
                   <button type="button" title={t("Supprimer")} onClick={() => { removeMessage.mutate(m); setActionFor(null); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
              <div
                onClick={() => { if (mine && !m.deleted_at) setActionFor(actionFor === m.id ? null : m.id); }}
                className={`max-w-[75%] rounded-3xl overflow-hidden text-sm shadow-sm ${m.pending ? "opacity-70" : ""} ${m.deleted_at ? "bg-secondary/50 text-muted-foreground italic" : mine ? "text-primary-foreground cursor-pointer" : "bg-card border border-border/50 text-foreground"}`}
                style={!m.deleted_at && mine ? { backgroundImage: "var(--gradient-gold)" } : undefined}>
                {m.deleted_at ? (
                   <div className="px-4 py-2">{t("Message supprimé")}</div>
                ) : (
                  <>
                    {parent && (
                      <div className={`mx-2 mt-2 px-3 py-1.5 rounded-lg text-xs border-l-2 ${mine ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-background/60 border-[color:var(--gold)]"}`}>
                         <div className="opacity-70">{parent.sender === ctx.userId ? t("Vous") : peer.pseudo}</div>
                         <div className="truncate">{parent.deleted_at ? t("Message supprimé") : parent.content || (parent.audio_path ? t("Message vocal") : t("Photo"))}</div>
                      </div>
                    )}
                    {m.image_url && (
                      <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                         <img src={m.image_url} alt={t("Photo partagée")} className="max-h-72 w-auto object-cover" />
                      </a>
                    )}
                    {m.audio_url && (
                      <div className="px-3 py-2 flex items-center gap-2">
                        <audio src={m.audio_url} controls preload="metadata" className="h-9 max-w-[220px]" />
                        {m.audio_duration ? (
                          <span className="text-[11px] opacity-70 tabular-nums">
                            {Math.floor(m.audio_duration / 60)}:{String(m.audio_duration % 60).padStart(2, "0")}
                          </span>
                        ) : null}
                        <a
                          href={m.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] underline opacity-70"
                           title={t("Ouvrir le vocal si la lecture ne fonctionne pas")}
                        >
                           {t("Ouvrir")}
                        </a>
                      </div>
                    )}

                    {m.content && <div className="px-4 pt-2.5 whitespace-pre-wrap break-words">{m.content}</div>}
                    <div className={`px-4 pb-1.5 pt-0.5 text-[10px] flex items-center gap-1 ${mine ? "justify-end opacity-80" : "text-muted-foreground"}`}>
                       {m.edited_at && t("modifié · ")}
                       {new Date(m.created_at).toLocaleTimeString(locale === "ar" ? "ar" : locale === "en" ? "en" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {mine && <CheckCheck className="h-3.5 w-3.5" />}
                    </div>
                  </>
                )}
              </div>
              {!mine && !m.deleted_at && (
                 <button type="button" title={t("Répondre")} onClick={() => { setReplyTo(m); setEditing(null); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                  <Reply className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
        {peerTyping && (
          <div className="flex justify-start">
             <div className="bg-secondary text-muted-foreground rounded-2xl px-4 py-2 text-sm">{peer.pseudo} {t("écrit…")}</div>
          </div>
        )}
      </div>

      {(replyTo || editing) && (
        <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 truncate border-l-2 border-[color:var(--gold)] pl-2">
             {editing ? t("Modification du message : ") : t("Réponse à : ")}
             {(editing ?? replyTo)?.content || ((editing ?? replyTo)?.audio_path ? t("Message vocal") : t("Photo"))}
          </div>
           <button type="button" onClick={() => { setReplyTo(null); setEditing(null); setText(""); }} aria-label={t("Annuler")}><X className="h-4 w-4" /></button>
        </div>
      )}

      {!messagingAllowed ? (
        <div className="p-4 border-t border-border/60 text-center text-sm text-muted-foreground">
           {t(MESSAGE_BLOCKED_HINT)}
        </div>
      ) : (
      <form onSubmit={(e) => { e.preventDefault(); submitMessage(); }} className="p-3 border-t border-border/60 flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
        {!voiceActive && (
          <>
             <Button type="button" size="icon" variant="outline" className="rounded-full h-10 w-10 shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading} title={t("Envoyer une photo")}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
            </Button>
            <EmojiPicker onPick={(e) => setText((t) => t + e)} />
          </>
        )}
        <VoiceRecorder onSend={handleVoice} sending={sendingVoice} onActiveChange={setVoiceActive} />
        {!voiceActive && (
          <>
            <Input
              value={text}
              onChange={(e) => { setText(e.target.value); notifyTyping(); }}
               placeholder={editing ? t("Modifier votre message...") : t("Écrire un message...")}
              maxLength={2000}
              className="rounded-full h-11 bg-card"
            />
            <Button type="submit" size="icon" disabled={!text.trim()} className="rounded-full h-11 w-11 shrink-0">
              {editing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </Button>
          </>
        )}
      </form>
      )}

      <AlertDialog open={confirmDeleteConvo} onOpenChange={setConfirmDeleteConvo}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle>{t("Supprimer cette conversation ?")}</AlertDialogTitle>
            <AlertDialogDescription>
               {t("Elle disparaîtra de votre messagerie. Votre correspondant·e conservera sa copie.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <AlertDialogCancel>{t("Annuler")}</AlertDialogCancel>
             <AlertDialogAction onClick={() => deleteConversation.mutate()}>{t("Supprimer")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle>{t("Bloquer")} {peer.pseudo} ?</AlertDialogTitle>
            <AlertDialogDescription>
               {t("Cette personne ne pourra plus vous contacter ni voir votre profil, et réciproquement. Vous pourrez la débloquer depuis sa fiche.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <AlertDialogCancel>{t("Annuler")}</AlertDialogCancel>
             <AlertDialogAction onClick={() => blockPeer.mutate()}>{t("Bloquer")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle>{t("Signaler")} {peer.pseudo}</AlertDialogTitle>
            <AlertDialogDescription>
               {t("Décrivez brièvement l'abus constaté. Notre équipe de modération examinera le signalement.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
             placeholder={t("Propos déplacés, harcèlement, arnaque…")}
            maxLength={500}
            rows={4}
          />
          <AlertDialogFooter>
             <AlertDialogCancel>{t("Annuler")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={reportReason.trim().length < 10 || reportAbuse.isPending}
              onClick={(e) => { e.preventDefault(); reportAbuse.mutate(); }}
            >
               {t("Envoyer le signalement")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
