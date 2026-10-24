import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListProfiles } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { ageFromBirthdate } from "@/lib/profile";
import { frenchPlace, PROFILE_STATUS_LABELS } from "@/lib/admin-display";

export const Route = createFileRoute("/admin/profiles/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profils — Admin Nooryaa" }, { name: "description", content: "Gestion des profils des membres Nooryaa." }, { property: "og:title", content: "Profils — Admin Nooryaa" }, { property: "og:description", content: "Gestion des profils des membres Nooryaa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminProfilesList,
});

const STATUS_LABEL = PROFILE_STATUS_LABELS;
const STATUS_CLASS: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] text-[color:var(--gold)]",
  banned: "bg-destructive/10 text-destructive",
};

function AdminProfilesList() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [gender, setGender] = useState<"all" | "homme" | "femme">("all");
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const list = useServerFn(adminListProfiles);

  const { data } = useQuery({
    queryKey: ["admin-profiles", search, status, gender, page, from, to],
    queryFn: () => list({ data: { q: search, status, gender, page, from: from || undefined, to: to || undefined } }),
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
        <h1 className="text-3xl font-serif text-primary">Profils</h1>
        <div className="inline-flex rounded-full bg-secondary/60 p-1 border border-border/60">
          {([
            { v: "all", label: "Tous" },
            { v: "homme", label: "Hommes" },
            { v: "femme", label: "Femmes" },
          ] as const).map((t) => (
            <Button
              key={t.v}
               variant="ghost"
               size="sm"
              onClick={() => { setGender(t.v); setPage(0); }}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${gender === t.v ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:text-foreground"}`}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(q); }} className="bg-card rounded-2xl p-4 border border-border/60 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Recherche (pseudo, email, téléphone)</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="amina_92, exemple@..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Statut</label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
                <SelectItem value="banned">Bannis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="prof-from">Inscrit du</label>
            <input
              id="prof-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => { setFrom(e.target.value); setPage(0); }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="prof-to">au</label>
            <input
              id="prof-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => { setTo(e.target.value); setPage(0); }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <Button type="submit">Rechercher</Button>
        </form>

        <div className="bg-card rounded-2xl border border-border/60 overflow-x-auto">
          <table className="w-full text-xs table-fixed min-w-[760px]">
            <thead className="bg-secondary/40 text-left">
              <tr>
                <th className="px-1 py-2 font-medium text-xs w-[3%] text-center"><span className="sr-only">Profil vérifié</span></th>
                <th className="px-2 py-2 font-medium text-xs w-[5%]">Photo</th>
                <th className="px-2 py-2 font-medium text-xs w-[9%]">Pseudo</th>
                <th className="px-2 py-2 font-medium text-xs w-[8%]">Nom</th>
                <th className="px-2 py-2 font-medium text-xs w-[8%]">Prénom</th>
                <th className="px-2 py-2 font-medium text-xs w-[13%]">Email</th>
                <th className="px-2 py-2 font-medium text-xs w-[9%]">Téléphone</th>
                <th className="px-2 py-2 font-medium text-xs w-[8%]">Ville</th>
                <th className="px-2 py-2 font-medium text-xs w-[7%]">Pays</th>

                <th className="px-2 py-2 font-medium text-xs w-[4%] whitespace-nowrap">Âge</th>
                <th className="px-2 py-2 font-medium text-xs w-[10%] whitespace-nowrap">Inscrit le</th>
                <th className="px-2 py-2 font-medium text-xs w-[8%]">Statut</th>
                <th className="px-2 py-2 font-medium text-xs w-[4%]"></th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((p: any) => {
                const d = (data.display?.[p.id] ?? {}) as Record<string, string>;
                return (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-1 py-2 text-center align-middle">
                    {p.photo_verified ? (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[color:var(--verified-bg)]"
                        title="Profil vérifié"
                        aria-label="Profil vérifié"
                      >
                        <BadgeCheck className="h-4 w-4 text-[color:var(--verified)]" aria-hidden />
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">

                    <Link to="/admin/profiles/$id" params={{ id: p.id }} className="block w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border/60">
                      {p.primary_photo_url ? (
                        <img src={p.primary_photo_url} alt={p.pseudo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">—</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-medium text-primary" data-no-translate><span className="block truncate" title={d.pseudo ?? p.pseudo}>{d.pseudo ?? p.pseudo}</span></td>
                  <td className="px-2 py-2" data-no-translate><span className="block truncate" title={d.last_name ?? p.last_name ?? ""}>{d.last_name ?? p.last_name ?? "—"}</span></td>
                  <td className="px-2 py-2" data-no-translate><span className="block truncate" title={d.first_name ?? p.first_name ?? ""}>{d.first_name ?? p.first_name ?? "—"}</span></td>
                  <td className="px-2 py-2 text-muted-foreground" data-no-translate><span className="block truncate" title={p.email}>{p.email}</span></td>
                  <td className="px-2 py-2 text-muted-foreground" data-no-translate><span className="block truncate" title={p.phone ?? ""}>{p.phone ?? "—"}</span></td>
                  <td className="px-2 py-2" data-no-translate><span className="block truncate" title={d.city ?? frenchPlace(p.city) ?? ""}>{d.city ?? frenchPlace(p.city) ?? "—"}</span></td>
                  <td className="px-2 py-2" data-no-translate><span className="block truncate" title={frenchPlace(p.country) ?? ""}>{frenchPlace(p.country) ?? "—"}</span></td>
                  <td className="px-2 py-2 whitespace-nowrap tabular-nums">{ageFromBirthdate(p.birthdate) ?? "—"}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`block truncate text-center text-xs px-1 py-0.5 rounded-full ${STATUS_CLASS[p.status] ?? ""}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Link to="/admin/profiles/$id" params={{ id: p.id }} className="text-primary underline text-xs">Voir</Link>
                  </td>
                </tr>
                );
              })}
              {data && data.rows.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">Aucun profil</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.count > data.pageSize && (
          <div className="flex justify-between text-sm items-center">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Précédent</Button>
            <span className="text-muted-foreground">Page {page + 1} / {Math.ceil(data.count / data.pageSize)}</span>
            <Button variant="outline" size="sm" disabled={(page + 1) * data.pageSize >= data.count} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
          </div>
        )}
      </main>
    </div>
  );
}