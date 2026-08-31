import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Heart, MessageCircle, Megaphone, Mail, Monitor, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/compte/notifications")({
  head: () => ({ meta: [{ title: "Mes notifications — Nooryaa" }] }),
  component: NotificationsPage,
});

type TypeKey = "likes" | "messages" | "news";
type ChannelKey = "email" | "push_in_app" | "push_mobile";

const TYPES: { key: TypeKey; label: string; description: string; icon: any }[] = [
  { key: "likes", label: "Like reçu", description: "Quand un profil vous like.", icon: Heart },
  { key: "messages", label: "Nouveau message", description: "Quand vous recevez un message.", icon: MessageCircle },
  { key: "news", label: "Actualités Nooryaa", description: "Nouveautés, conseils et offres.", icon: Megaphone },
];

const CHANNELS: { key: ChannelKey; label: string; short: string; icon: any }[] = [
  { key: "email", label: "Notifications par email", short: "Email", icon: Mail },
  { key: "push_in_app", label: "Notifications push in app", short: "In app", icon: Monitor },
  { key: "push_mobile", label: "Notifications push mobile", short: "Mobile", icon: Smartphone },
];

type Prefs = Record<TypeKey, Record<ChannelKey, boolean>>;

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    likes: { email: true, push_in_app: true, push_mobile: false },
    messages: { email: true, push_in_app: true, push_mobile: false },
    news: { email: false, push_in_app: false, push_mobile: false },
  });

  const toggle = (t: TypeKey, c: ChannelKey, v: boolean) =>
    setPrefs((p) => ({ ...p, [t]: { ...p[t], [c]: v } }));

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Mes notifications</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Choisissez, pour chaque type de notification, les canaux sur lesquels vous souhaitez être averti.
      </p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium py-3">Type de notification</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="font-medium py-3 px-2 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <c.icon className="h-4 w-4 text-primary" />
                    {c.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {TYPES.map((t) => (
              <tr key={t.key}>
                <td className="py-4 pr-4">
                  <div className="flex items-start gap-3">
                    <t.icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                </td>
                {CHANNELS.map((c) => (
                  <td key={c.key} className="py-4 px-2 text-center">
                    <Switch
                      aria-label={`${t.label} — ${c.label}`}
                      checked={prefs[t.key][c.key]}
                      onCheckedChange={(v) => toggle(t.key, c.key, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked */}
      <div className="sm:hidden divide-y divide-border/60">
        {TYPES.map((t) => (
          <div key={t.key} className="py-4 space-y-3">
            <div className="flex items-start gap-3">
              <t.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            </div>
            <div className="space-y-2 pl-8">
              {CHANNELS.map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground inline-flex items-center gap-2">
                    <c.icon className="h-4 w-4 text-primary" />
                    {c.short}
                  </span>
                  <Switch
                    aria-label={`${t.label} — ${c.label}`}
                    checked={prefs[t.key][c.key]}
                    onCheckedChange={(v) => toggle(t.key, c.key, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button className="rounded-full" onClick={() => toast.success("Préférences enregistrées")}>
        Enregistrer
      </Button>
    </div>
  );
}
