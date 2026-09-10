import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Mail, Bell, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compte/notifications")({
  head: () => ({ meta: [{ title: "Mes notifications — Nooryaa" }] }),
  component: NotificationsPage,
});

const CHANNELS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "inapp", label: "Push in-app", icon: Bell },
  { key: "mobile", label: "Push mobile", icon: Smartphone },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];

const TYPES: { key: string; label: string; description: string }[] = [
  { key: "messages", label: "Nouveaux messages", description: "Quand vous recevez un message" },
  { key: "likes", label: "Nouveaux likes", description: "Quand quelqu'un vous like" },
  { key: "matchs", label: "Nouveaux matchs", description: "Quand vous avez un match" },
  { key: "visites", label: "Visites de profil", description: "Quand quelqu'un visite votre profil" },
  { key: "suggestions", label: "Suggestions quotidiennes", description: "Vos suggestions de profils du jour" },
  { key: "activite", label: "Rappels d'activité", description: "Rappels pour rester actif" },
];

type Prefs = Record<string, Record<ChannelKey, boolean>>;

// Par défaut à l'inscription : pas d'email pour les messages, likes et visites.
// L'utilisateur active lui-même ses préférences ensuite.
const EMAIL_OFF_BY_DEFAULT = new Set(["messages", "likes", "visites"]);

const DEFAULTS: Prefs = TYPES.reduce((acc, t) => {
  acc[t.key] = {
    email: !EMAIL_OFF_BY_DEFAULT.has(t.key),
    inapp: true,
    mobile: t.key === "messages" || t.key === "likes" || t.key === "matchs",
  };
  return acc;
}, {} as Prefs);

function normalize(raw: any): Prefs {
  const out: Prefs = {} as Prefs;
  for (const t of TYPES) {
    const saved = raw?.[t.key];
    out[t.key] = {
      email: typeof saved?.email === "boolean" ? saved.email : DEFAULTS[t.key].email,
      inapp: typeof saved?.inapp === "boolean" ? saved.inapp : DEFAULTS[t.key].inapp,
      mobile: typeof saved?.mobile === "boolean" ? saved.mobile : DEFAULTS[t.key].mobile,
    };
  }
  return out;
}

function NotificationsPage() {
  const ctx = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (profile && !hydrated) {
      setPrefs(normalize((profile.preferences as any)?.notifications));
      setHydrated(true);
    }
  }, [profile, hydrated]);

  async function toggle(typeKey: string, channel: ChannelKey, value: boolean) {
    const next: Prefs = { ...prefs, [typeKey]: { ...prefs[typeKey], [channel]: value } };
    setPrefs(next);
    const { error } = await supabase
      .from("profiles")
      .update({ preferences: { ...((profile?.preferences as any) ?? {}), notifications: next } })
      .eq("id", ctx.userId);
    if (error) {
      toast.error("Impossible d'enregistrer la préférence");
      setPrefs(prefs);
      return;
    }
    qc.invalidateQueries({ queryKey: ["me", ctx.userId] });
    toast.success("Préférence enregistrée");
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Mes notifications</h1>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Choisissez, pour chaque type de notification, les canaux que vous acceptez.
      </p>

      <div className="space-y-4">
        {TYPES.map((t) => (
          <section
            key={t.key}
            className="bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] p-4"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </div>
            <div className="divide-y divide-border/60">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.key} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      {c.label}
                    </span>
                    <Switch
                      aria-label={`${t.label} — ${c.label}`}
                      checked={prefs[t.key]?.[c.key] ?? false}
                      onCheckedChange={(v) => toggle(t.key, c.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
