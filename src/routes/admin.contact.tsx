import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminCheckAuth } from "@/lib/admin.functions";

// L'ancienne page « Contact » est regroupée dans « Assistance et contact ».
export const Route = createFileRoute("/admin/contact")({
  ssr: false,
  head: () => ({ meta: [{ title: "Contact — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
    throw redirect({ to: "/admin/support", search: { tab: "contact" } });
  },
});
