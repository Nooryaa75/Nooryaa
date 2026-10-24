import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminCheckAuth, adminNotificationCounts, adminListContacts, adminMarkContactRead, adminDeleteContact } from "@/lib/admin.functions";
import { adminListTickets } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Trash2, CheckCircle2, Circle, LifeBuoy } from "lucide-react";

const searchSchema = z.object({
  tab: z.enum(["assistance", "contact"]).catch("assistance").default("assistance"),
});

export const Route = createFileRoute("/admin/support/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Assistance et contact — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminSupport,
});

export const STATUS_LABEL: Record<string, string> = {
  open: "Non traité",
  in_progress: "En cours",
  resolved: "Traité",
  closed: "Fermé",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-secondary text-primary",
  resolved: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

function AdminSupport() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const counts = useServerFn(adminNotificationCounts);
  const { data: notif } = useQuery({
    queryKey: ["admin-notif-counts"],
    queryFn: () => counts(),
    refetchInterval: 20000,
  });

  const go = (next: "assistance" | "contact") =>
    navigate({ to: "/admin/support", search: { tab: next }, replace: true });

  const openTickets = notif?.openTickets ?? 0;
  const unreadContacts = notif?.unreadContacts ?? 0;

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-5">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Assistance et contact</h1>
          <p className="text-sm text-muted-foreground">
            Les demandes venues des membres et les messages envoyés depuis le formulaire de contact, au même endroit.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-full border border-border/60 bg-card p-1">
          <button
            type="button"
            onClick={() => go("assistance")}
            aria-pressed={tab === "assistance"}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "assistance" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            Assistance des membres
            {openTickets > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {openTickets}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => go("contact")}
            aria-pressed={tab === "contact"}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "contact" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-4 w-4" />
            Messages de contact
            {unreadContacts > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {unreadContacts}
              </span>
            )}
          </button>
        </div>

        {tab === "assistance" ? <TicketList /> : <ContactList />}
      </main>
    </div>
  );
}

function TicketList() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const list = useServerFn(adminListTickets);
  const { data } = useQuery({
    queryKey: ["admin-tickets", status, q],
    queryFn: () => list({ data: { status, q } }),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Rechercher un membre ou un message…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select
          aria-label="Statut"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="open">Non traité</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Traité</option>
          <option value="closed">Fermé</option>
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
        {(data ?? []).map((t) => (
          <Link key={t.id} to="/admin/support/$id" params={{ id: t.id }} className="flex items-start gap-3 p-4 hover:bg-muted/40">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-primary">{t.profile?.pseudo ?? "Membre supprimé"}</span>
                <span className="text-xs text-muted-foreground">{t.profile?.email}</span>
                <span className="text-xs rounded-full bg-muted px-2 py-0.5">{t.category}</span>
                {t.priority !== "normal" && (
                  <span className="text-xs rounded-full bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] px-2 py-0.5">{t.priority}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.message}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_TONE[t.status] ?? "bg-muted"}`}>
                {STATUS_LABEL[t.status] ?? t.status}
              </span>
              <div className="text-[11px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
          </Link>
        ))}
        {data && data.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Aucun ticket.</div>}
      </div>
    </div>
  );
}

function ContactList() {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const list = useServerFn(adminListContacts);
  const mark = useServerFn(adminMarkContactRead);
  const del = useServerFn(adminDeleteContact);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-contacts", onlyUnread], queryFn: () => list({ data: { onlyUnread } }) });

  const markMut = useMutation({
    mutationFn: (vars: { id: string; read: boolean }) => mark({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contacts"] });
      qc.invalidateQueries({ queryKey: ["admin-notif-counts"] });
    },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Supprimé");
      qc.invalidateQueries({ queryKey: ["admin-contacts"] });
      qc.invalidateQueries({ queryKey: ["admin-notif-counts"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">Messages envoyés depuis le formulaire de contact de Nooryaa.</p>
        <Button variant={onlyUnread ? "default" : "outline"} size="sm" onClick={() => setOnlyUnread((v) => !v)}>
          {onlyUnread ? "Tous" : "Non lus uniquement"}
        </Button>
      </div>

      <div className="space-y-3">
        {data?.map((m: any) => (
          <div key={m.id} className={`bg-card rounded-2xl border p-4 space-y-2 ${m.read ? "border-border/60" : "border-primary/40 shadow-[var(--shadow-card)]"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium text-primary">{m.subject || "(sans sujet)"}</div>
                <div className="text-xs text-muted-foreground">
                  De <strong>{m.name}</strong> · <a href={`mailto:${m.email}`} className="underline">{m.email}</a> · {new Date(m.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markMut.mutate({ id: m.id, read: !m.read })}>
                  {m.read ? <><Circle className="h-4 w-4 mr-1" /> Marquer non lu</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Marquer lu</>}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer ce message ?")) delMut.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
          </div>
        ))}
        {data && data.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60 text-muted-foreground">Aucun message.</div>
        )}
      </div>
    </div>
  );
}
