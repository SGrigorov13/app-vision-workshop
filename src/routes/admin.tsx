import { createFileRoute } from "@tanstack/react-router";

import { CondoRegistration } from "@/components/admin/CondoRegistration";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Регистрация на етажна собственост — VhodArena.eu" },
      { name: "description", content: "Админ панел за регистрация на етажна собственост: сграда, IBAN и органи на управление." },
      { property: "og:title", content: "Регистрация на етажна собственост — VhodArena.eu" },
      { property: "og:description", content: "Админ панел за регистрация на етажна собственост." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CondoRegistration,
});
