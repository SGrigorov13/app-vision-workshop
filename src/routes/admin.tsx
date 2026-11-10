import { createFileRoute } from "@tanstack/react-router";

import { AdminPanel, type AdminTab } from "@/components/admin/AdminPanel";

const TABS: AdminTab[] = ["condos", "new", "billing"];

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { tab?: AdminTab } =>
    TABS.includes(s["tab"] as AdminTab) ? { tab: s["tab"] as AdminTab } : {},
  head: () => ({
    meta: [
      { title: "Админ панел — VhodArena.eu" },
      { name: "description", content: "Регистрация на етажни собствености, QR покани за домоуправител, контролен съвет, касиер и живущи, и абонамент." },
      { property: "og:title", content: "Админ панел — VhodArena.eu" },
      { property: "og:description", content: "Регистрация на етажни собствености, QR покани и абонамент в евро." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const { tab } = Route.useSearch();
  return <AdminPanel tab={tab ?? "condos"} />;
}
