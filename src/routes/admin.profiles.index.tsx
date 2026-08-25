import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListProfiles } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ageFromBirthdate } from "@/lib/profile";

export const Route = createFileRoute("/admin/profiles/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profils — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminProfilesList,
});

const STATUS_LABEL: Record<string, string> = { active: "Actif", suspended: "Suspendu", banned: "Banni" };
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
  const list = useServerFn(adminListProfiles);

  const { data } = useQuery({
    queryKey: ["admin-profiles", search, status, gender, page],
    queryFn: () => list({ data: { q: search, status, gender, page } }),
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
            <button
              key={t.v}
              onClick={() => { setGender(t.v); setPage(0); }}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${gender === t.v ? "bg-primary text-primary-foreground shadow" : "text-foreground/70 hover:text-foreground"}`}
            >
              {t.label}
            </button>
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
          <Button type="submit">Rechercher</Button>
        </form>

        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Photo</th>
                <th className="px-4 py-2 font-medium">Pseudo</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Téléphone</th>
                <th className="px-4 py-2 font-medium">Ville</th>
                <th className="px-4 py-2 font-medium">Âge</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((p: any) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <Link to="/admin/profiles/$id" params={{ id: p.id }} className="block w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border/60">
                      {p.primary_photo_url ? (
                        <img src={p.primary_photo_url} alt={p.pseudo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">—</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-primary">{p.pseudo}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.phone ?? "—"}</td>
                  <td className="px-4 py-2">{p.city ?? "—"}</td>
                  <td className="px-4 py-2">{ageFromBirthdate(p.birthdate) ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[p.status] ?? ""}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to="/admin/profiles/$id" params={{ id: p.id }} className="text-primary underline text-xs">Voir</Link>
                  </td>
                </tr>
              ))}
              {data && data.rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Aucun profil</td></tr>
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