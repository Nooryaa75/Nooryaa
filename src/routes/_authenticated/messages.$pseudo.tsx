import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ImagePlus, Loader2, MoreVertical, Pencil, Trash2, Reply, X, Check, Flag } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { moderateMessage } from "@/lib/moderation.functions";
import { lexiconCheck } from "@/lib/moderation-rules";
import { EmojiPicker } from "@/components/EmojiPicker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/messages/$pseudo")({
  head: ({ params }) => ({ meta: [{ title: `Chat avec ${params.pseudo} — Nooryaa` }] }),
  component: Conversation,
});

function Conversation() {
  const { pseudo } = Route.useParams();
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannel = useRef<any>(null);
  const lastTypingSent = useRef(0);

  const { data: peer } = useQuery({
    queryKey: ["peer", pseudo],
    queryFn: async () => (await supabase.from("profiles").select("id, pseudo, primary_photo_url").eq("pseudo", pseudo).single()).data,
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", ctx.userId, peer?.id],
    enabled: !!peer,
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender.eq.${ctx.userId},receiver.eq.${peer!.id}),and(sender.eq.${peer!.id},receiver.eq.${ctx.userId})`)
        .order("created_at");
      const rows = (data ?? []).filter((m: any) => !(m.hidden_for ?? []).includes(ctx.userId));
      // Resolve signed URLs for any attached photos
      const withImg = await Promise.all(rows.map(async (m: any) => {
        if (!m.image_path || m.deleted_at) return m;
        const { data: s } = await supabase.storage.from("message-photos").createSignedUrl(m.image_path, 3600);
        return { ...m, image_url: s?.signedUrl };
      }));
      return withImg;
    },
  });

  useEffect(() => {
    if (!peer) return;
    const channel = supabase.channel(`msg-${peer.id}`).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      (payload: any) => {
        const m = payload.new ?? payload.old;
        if (!m) return;
        if ((m.sender === ctx.userId && m.receiver === peer.id) || (m.sender === peer.id && m.receiver === ctx.userId)) {
          qc.invalidateQueries({ queryKey: ["messages", ctx.userId, peer.id] });
        }
      },
    ).subscribe();
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

  async function checkContent(content: string) {
    const local = lexiconCheck(content);
    if (local.verdict === "block") throw new Error(local.reason);
    let verdict: "allow" | "warn" | "block" = local.verdict;
    let reason = local.reason;
    try {
      const res = await moderate({ data: { content, targetUserId: peer!.id } });
      verdict = res.verdict;
      reason = res.reason;
    } catch {
      // en cas d'indisponibilité de l'analyse, on garde le filtre local
    }
    if (verdict === "block") throw new Error(reason || "Ce message ne respecte pas la charte de Nooryaa.");
    if (verdict === "warn" && reason) toast.warning(reason);
  }

  const send = useMutation({
    mutationFn: async () => {
      if (!peer || !text.trim()) return;
      const content = text.trim();
      await checkContent(content);

      if (editing) {
        const { error } = await supabase.from("messages")
          .update({ content, edited_at: new Date().toISOString() } as any)
          .eq("id", editing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("messages").insert({
        sender: ctx.userId, receiver: peer.id, content,
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setText(""); setReplyTo(null); setEditing(null);
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMessage = useMutation({
    mutationFn: async (m: any) => {
      const { error } = await supabase.from("messages")
        .update({ deleted_at: new Date().toISOString(), content: null, image_path: null } as any)
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Message supprimé"); qc.invalidateQueries({ queryKey: ["messages"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteConversation = useMutation({
    mutationFn: async () => {
      if (!peer) return;
      for (const m of messages ?? []) {
        const hidden: string[] = [...((m as any).hidden_for ?? [])];
        if (hidden.includes(ctx.userId)) continue;
        hidden.push(ctx.userId);
        await supabase.from("messages").update({ hidden_for: hidden } as any).eq("id", m.id);
      }
    },
    onSuccess: () => {
      toast.success("Conversation supprimée");
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/messages" });
    },
    onError: (e: any) => toast.error(e.message),
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
      toast.success("Signalement envoyé à la modération");
      setReportOpen(false);
      setReportReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });



  async function handlePhoto(file: File) {
    if (!peer) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo trop lourde (max 5 Mo)"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("message-photos").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("messages").insert({
        sender: ctx.userId, receiver: peer.id, image_path: path,
        ...(replyTo ? { reply_to: replyTo.id } : {}),
      } as any);
      if (error) throw error;
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["messages"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!peer) return <div className="m-auto text-muted-foreground">Chargement...</div>;

  const byId = new Map((messages ?? []).map((m: any) => [m.id, m]));

  return (
    <>
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <Link to="/messages" className="md:hidden text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/profile/$pseudo" params={{ pseudo: peer.pseudo }} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden">
            {peer.primary_photo_url && <img src={peer.primary_photo_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="min-w-0">
            <span className="font-serif text-primary block truncate">{peer.pseudo}</span>
            {peerTyping && <span className="text-xs text-[color:var(--gold)]">est en train d'écrire…</span>}
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Options de la conversation"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-2" /> Signaler en cas d'abus
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDeleteConvo(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer la conversation
            </DropdownMenuItem>
          </DropdownMenuContent>

        </DropdownMenu>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages?.map((m: any) => {
          const mine = m.sender === ctx.userId;
          const parent = m.reply_to ? byId.get(m.reply_to) : null;
          return (
            <div key={m.id} className={`flex items-center gap-1 group ${mine ? "justify-end" : "justify-start"}`}>
              {mine && !m.deleted_at && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button type="button" title="Répondre" onClick={() => { setReplyTo(m); setEditing(null); }} className="text-muted-foreground hover:text-primary"><Reply className="h-4 w-4" /></button>
                  {m.content && (
                    <button type="button" title="Modifier" onClick={() => { setEditing(m); setReplyTo(null); setText(m.content); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  )}
                  <button type="button" title="Supprimer" onClick={() => removeMessage.mutate(m)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl overflow-hidden text-sm ${m.deleted_at ? "bg-secondary/50 text-muted-foreground italic" : mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {m.deleted_at ? (
                  <div className="px-4 py-2">Message supprimé</div>
                ) : (
                  <>
                    {parent && (
                      <div className={`mx-2 mt-2 px-3 py-1.5 rounded-lg text-xs border-l-2 ${mine ? "bg-primary-foreground/10 border-primary-foreground/50" : "bg-background/60 border-[color:var(--gold)]"}`}>
                        <div className="opacity-70">{parent.sender === ctx.userId ? "Vous" : peer.pseudo}</div>
                        <div className="truncate">{parent.deleted_at ? "Message supprimé" : parent.content || "Photo"}</div>
                      </div>
                    )}
                    {m.image_url && (
                      <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                        <img src={m.image_url} alt="Photo partagée" className="max-h-72 w-auto object-cover" />
                      </a>
                    )}
                    {m.content && <div className="px-4 py-2 whitespace-pre-wrap break-words">{m.content}</div>}
                    {m.edited_at && <div className="px-4 pb-1 text-[10px] opacity-70">modifié</div>}
                  </>
                )}
              </div>
              {!mine && !m.deleted_at && (
                <button type="button" title="Répondre" onClick={() => { setReplyTo(m); setEditing(null); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                  <Reply className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
        {peerTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-muted-foreground rounded-2xl px-4 py-2 text-sm">{peer.pseudo} écrit…</div>
          </div>
        )}
      </div>

      {(replyTo || editing) && (
        <div className="px-3 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 truncate border-l-2 border-[color:var(--gold)] pl-2">
            {editing ? "Modification du message : " : "Réponse à : "}
            {(editing ?? replyTo)?.content || "Photo"}
          </div>
          <button type="button" onClick={() => { setReplyTo(null); setEditing(null); setText(""); }} aria-label="Annuler"><X className="h-4 w-4" /></button>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="p-3 border-t border-border/60 flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
        <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} title="Envoyer une photo">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>
        <EmojiPicker onPick={(e) => setText((t) => t + e)} />
        <Input
          value={text}
          onChange={(e) => { setText(e.target.value); notifyTyping(); }}
          placeholder={editing ? "Modifier votre message..." : "Votre message..."}
          maxLength={2000}
        />
        <Button type="submit" size="icon" disabled={!text.trim() || send.isPending}>
          {editing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <AlertDialog open={confirmDeleteConvo} onOpenChange={setConfirmDeleteConvo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle disparaîtra de votre messagerie. Votre correspondant·e conservera sa copie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConversation.mutate()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportOpen} onOpenChange={setReportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signaler {peer.pseudo}</AlertDialogTitle>
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
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={reportReason.trim().length < 10 || reportAbuse.isPending}
              onClick={(e) => { e.preventDefault(); reportAbuse.mutate(); }}
            >
              Envoyer le signalement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
