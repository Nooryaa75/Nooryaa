import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminAuditLog } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";

export const Route = createFileRoute("/admin/audit")({
  ssr: false,
  head: () => ({ meta: [{ title: "Journal d'audit — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminAudit,
});

function AdminAudit() {
  const fetchLog = useServerFn(adminAuditLog);
  const { data } = useQuery({ queryKey: ["admin-audit"], queryFn: () => fetchLog(), refetchInterval: 30000 });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-5">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Journal d'audit</h1>
          <p className="text-sm text-muted-foreground">Toutes les actions effectuées depuis l'administration.</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
          {(data ?? []).map((a) => (
            <div key={a.id} className="p-4 flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-primary text-sm">{a.action}</div>
                <p className="text-xs text-muted-foreground break-all">{a.details ? JSON.stringify(a.details) : "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleString("fr-FR")}</span>
            </div>
          ))}
          {data && data.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Aucune action enregistrée.</div>}
        </div>
      </main>
    </div>
  );
}
