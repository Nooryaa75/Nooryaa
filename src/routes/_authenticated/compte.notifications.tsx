import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compte/notifications")({
  head: () => ({ meta: [{ title: "Mes notifications — Nooryaa" }] }),
  component: NotificationsPage,
});

type Group = {
  title: string;
  items: { key: string; label: string; description: string }[];
};

const GROUPS: Group[] = [
  {
    title: "Activité",
    items: [
      { key: "messages", label: "Nouveaux messages", description: "Quand vous recevez un message" },
      { key: "likes", label: "Nouveaux likes", description: "Quand quelqu'un vous like" },
      { key: "matchs", label: "Nouveaux matchs", description: "Quand vous avez un match" },
      { key: "visites", label: "Visites de profil", description: "Quand quelqu'un visite votre profil" },
    ],
  },
  {
    title: "Rappels",
    items: [
      { key: "suggestions", label: "Suggestions quotidiennes", description: "Recevoir vos suggestions de profils" },
      { key: "activite", label: "Rappels d'activité", description: "Rappels pour rester actif" },
    ],
  },
  {
    title: "Notifications par email",
    items: [
      { key: "emails", label: "Recevoir les emails importants", description: "Mises à jour, sécurité et abonnements" },
    ],
  },
];

const DEFAULTS: Record<string, boolean> = {
  messages: true,
  likes: true,
  matchs: true,
  visites: false,
  suggestions: true,
  activite: true,
  emails: true,
};

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULTS);

  const toggle = (key: string, v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: v }));
    toast.success("Préférence enregistrée");
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Mes notifications</h1>
      </div>

      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="text-sm font-bold text-foreground mb-2">{g.title}</h2>
          <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] divide-y divide-border/60 overflow-hidden">
            {g.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Switch
                  aria-label={item.label}
                  checked={prefs[item.key]}
                  onCheckedChange={(v) => toggle(item.key, v)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
