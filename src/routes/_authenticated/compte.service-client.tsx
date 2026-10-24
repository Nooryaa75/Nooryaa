import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Headphones, Send, ChevronLeft, ChevronDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket, listMyTickets } from "@/lib/support.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/compte/service-client")({
  head: () => ({ meta: [{ title: "Service client — Nooryaa" }] }),
  component: ServiceClientPage,
});

const categories = [
  "Partenariat",
  "Inscription",
  "Connexion / Email",
  "Suppression de compte",
  "Abonnement",
  "Autres",
] as const;

type MyTicket = {
  id: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  replies: { id: string; author: string; content: string; created_at: string }[];
};

const STATUS_LABEL: Record<string, string> = {
  open: "Non traité",
  in_progress: "En cours",
  resolved: "Traité",
  closed: "Fermé",
};

function formatFr(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ServiceClientPage() {
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const submit = useServerFn(createSupportTicket);
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: () => listMyTickets() as Promise<{ tickets: MyTicket[] }>,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("Veuillez choisir un sujet.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Votre message doit faire au moins 10 caractères.");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: { category: category as (typeof categories)[number], message: message.trim() } });
      toast.success("Votre message a bien été envoyé à notre équipe.");
      setCategory("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    } catch (e: any) {
      toast.error(frenchError(e, "L'envoi a échoué. Veuillez réessayer."));
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tickets = history?.tickets ?? [];

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          Service client
        </h1>
      </div>

      {tickets.length > 0 && (
        <section className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-3">
          <h2 className="text-sm font-bold text-primary">Mes demandes</h2>
          <p className="text-sm text-muted-foreground">
            Retrouvez ici vos échanges avec notre équipe. Nous vous prévenons dans vos notifications dès que nous vous répondons.
          </p>
          <div className="divide-y divide-border/60">
            {tickets.map((t) => {
              const open = openIds.has(t.id);
              return (
                <div key={t.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-full flex items-center gap-3 text-left"
                    aria-expanded={open}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{t.category}</span>
                        <span className="text-[11px] rounded-full bg-secondary px-2 py-0.5 text-muted-foreground shrink-0">
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {formatFr(t.created_at)} · {t.replies.length > 0 ? `${t.replies.length} réponse${t.replies.length > 1 ? "s" : ""}` : "En attente de réponse"}
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="mt-3 space-y-2 pl-7">
                      <div className="rounded-2xl bg-secondary/60 p-3">
                        <p className="text-[11px] text-muted-foreground mb-1">Vous · {formatFr(t.created_at)}</p>
                        <p className="text-sm whitespace-pre-wrap">{t.message}</p>
                      </div>
                      {t.replies.map((r) => (
                        <div key={r.id} className="rounded-2xl border border-primary/25 bg-background p-3">
                          <p className="text-[11px] text-primary mb-1">Équipe Nooryaa · {formatFr(r.created_at)}</p>
                          <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-6">
        <p className="text-sm text-muted-foreground">
          Une question, un problème ou une suggestion ? Envoyez-nous un message, notre équipe vous répondra dans les meilleurs délais.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category">Sujet</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Choisissez un sujet" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Écrivez un message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez votre demande ici..."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </p>
          </div>
          <Button type="submit" disabled={loading} className="rounded-full gap-2">
            <Send className="h-4 w-4" />
            {loading ? "Envoi…" : "Envoyer mon message"}
          </Button>
        </form>
      </div>
    </div>
  );
}
