import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, Heart, MessageCircle, Sparkles, Eye, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from "@/hooks/useNotifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Centre de notifications — Nooryaa" },
      { name: "description", content: "Historique de vos notifications Nooryaa : likes, matchs, messages et visites de profil." },
      { property: "og:title", content: "Centre de notifications — Nooryaa" },
      { property: "og:description", content: "Historique de vos notifications Nooryaa." },
    ],
  }),
  component: NotificationsPage,
});

const KIND_ICON: Record<AppNotification["kind"], typeof Heart> = {
  like: Heart,
  match: Sparkles,
  message: MessageCircle,
  visit: Eye,
  system: Info,
};

function formatDate(iso: string, locale: string, tr: (s: string) => string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  const tag = locale === "en" ? "en-US" : locale === "ar" ? "ar" : "fr-FR";
  if (diffMin < 1) return tr("À l'instant");
  if (diffMin < 60) return tr("Il y a {n} min").replace("{n}", String(diffMin));
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return tr("Il y a {n} h").replace("{n}", String(diffH));
  return d.toLocaleDateString(tag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const { t: tr, locale } = useI18n();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unread = notifications?.filter((n) => !n.read_at).length ?? 0;

  function open(n: AppNotification) {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link) navigate({ to: n.link });
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="h-5 w-5 text-primary" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-[18px] text-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </span>
            <div>
              <h1 className="text-lg font-bold text-foreground">{tr("Notifications")}</h1>
              <p className="text-xs text-muted-foreground">
                {unread > 0
                  ? tr(unread > 1 ? "{n} non lues" : "{n} non lue").replace("{n}", String(unread))
                  : tr("Vous êtes à jour")}
              </p>
            </div>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              {tr("Tout marquer comme lu")}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications?.length ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center space-y-2">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold text-foreground">{tr("Aucune notification pour le moment")}</p>
            <p className="text-sm text-muted-foreground">
              {tr("Les likes, matchs, messages et visites apparaîtront ici.")}
            </p>
            <Link to="/browse" className="inline-block text-sm font-semibold text-primary hover:underline">
              {tr("Découvrir des profils")}
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => {
              const Icon = KIND_ICON[n.kind] ?? Info;
              const isUnread = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`w-full text-left flex items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                      isUnread
                        ? "border-primary/25 bg-secondary/60 hover:bg-secondary"
                        : "border-border/60 bg-card hover:bg-secondary/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isUnread ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1" data-no-translate>
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-sm ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {n.title}
                        </span>
                        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </span>
                      {n.body && <span className="block truncate text-xs text-muted-foreground mt-0.5">{n.body}</span>}
                      <span className="block text-[11px] text-muted-foreground/70 mt-1">{formatDate(n.created_at, locale, tr)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
