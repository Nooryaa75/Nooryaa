import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Heart, MessageCircle, ShieldCheck, Megaphone, Mail, Monitor, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/compte/notifications")({
  head: () => ({ meta: [{ title: "Mes notifications — Nooryaa" }] }),
  component: NotificationsPage,
});

type NotifKey =
  | "likes"
  | "messages"
  | "verifications"
  | "news"
  | "email_info"
  | "push_in_app"
  | "push_mobile";

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>({
    likes: true,
    messages: true,
    verifications: true,
    news: false,
    email_info: true,
    push_in_app: true,
    push_mobile: false,
  });

  const items: { key: NotifKey; label: string; description: string; icon: any }[] = [
    { key: "likes", label: "Likes reçus", description: "Être notifié quand un profil vous like.", icon: Heart },
    { key: "messages", label: "Nouveaux messages", description: "Être notifié quand vous recevez un message.", icon: MessageCircle },
    { key: "verifications", label: "Vérification & modération", description: "Statut de vos photos et de votre vérification selfie.", icon: ShieldCheck },
    { key: "news", label: "Actualités Nooryaa", description: "Nouveautés, conseils et événements de la communauté.", icon: Megaphone },
    { key: "email_info", label: "Notifications par email", description: "Informations, nouveautés et offres envoyées sur votre adresse email.", icon: Mail },
    { key: "push_in_app", label: "Notifications push in apps", description: "Alertes affichées directement dans l’application Nooryaa.", icon: Monitor },
    { key: "push_mobile", label: "Notifications push mobile", description: "Alertes envoyées sur votre téléphone, même hors de l’application.", icon: Smartphone },
  ];

  return (
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Mes notifications</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Choisissez les notifications que vous souhaitez recevoir sur Nooryaa.
      </p>
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <item.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch
              checked={prefs[item.key]}
              onCheckedChange={(v) => setPrefs({ ...prefs, [item.key]: v })}
            />
          </div>
        ))}
      </div>
      <Button className="rounded-full" onClick={() => toast.success("Préférences enregistrées")}>
        Enregistrer
      </Button>
    </div>
  );
}
