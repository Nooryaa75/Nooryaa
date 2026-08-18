import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/messages/$pseudo")({
  head: ({ params }) => ({ meta: [{ title: `Chat avec ${params.pseudo} — Noorya` }] }),
  component: Conversation,
});

function Conversation() {
  const { pseudo } = Route.useParams();
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const rows = data ?? [];
      // Resolve signed URLs for any attached photos
      const withImg = await Promise.all(rows.map(async (m: any) => {
        if (!m.image_path) return m;
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
      { event: "INSERT", schema: "public", table: "messages" },
      (payload: any) => {
        const m = payload.new;
        if ((m.sender === ctx.userId && m.receiver === peer.id) || (m.sender === peer.id && m.receiver === ctx.userId)) {
          qc.invalidateQueries({ queryKey: ["messages", ctx.userId, peer.id] });
        }
      },
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [peer, ctx.userId, qc]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const send = useMutation({
    mutationFn: async () => {
      if (!peer || !text.trim()) return;
      const { error } = await supabase.from("messages").insert({ sender: ctx.userId, receiver: peer.id, content: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: ["messages"] }); },
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
      const { error } = await supabase.from("messages").insert({ sender: ctx.userId, receiver: peer.id, image_path: path });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["messages"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (!peer) return <div className="m-auto text-muted-foreground">Chargement...</div>;

  return (
    <>
      <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        <Link to="/messages" className="md:hidden text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <Link to="/profile/$pseudo" params={{ pseudo: peer.pseudo }} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden">
            {peer.primary_photo_url && <img src={peer.primary_photo_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="font-serif text-primary">{peer.pseudo}</span>
        </Link>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages?.map((m) => {
          const mine = m.sender === ctx.userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl overflow-hidden text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {(m as any).image_url && (
                  <a href={(m as any).image_url} target="_blank" rel="noopener noreferrer">
                    <img src={(m as any).image_url} alt="Photo partagée" className="max-h-72 w-auto object-cover" />
                  </a>
                )}
                {m.content && <div className="px-4 py-2">{m.content}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="p-3 border-t border-border/60 flex gap-2 items-center">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
        <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} title="Envoyer une photo">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre message..." maxLength={2000} />
        <Button type="submit" size="icon" disabled={!text.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
      </form>
    </>
  );
}