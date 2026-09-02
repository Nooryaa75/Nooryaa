import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({ meta: [{ title: "Mon compte — Nooryaa" }] }),
  component: CompteLayout,
});

function CompteLayout() {
  return (
    <div className="max-w-md mx-auto md:max-w-5xl">
      <Outlet />
    </div>
  );
}
