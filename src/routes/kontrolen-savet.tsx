import { createFileRoute } from "@tanstack/react-router";

import { SupervisorPortal } from "@/components/supervisor/SupervisorPortal";

export const Route = createFileRoute("/kontrolen-savet")({
  head: () => ({
    meta: [
      { title: "Контролен съвет — Одит и верификация | VhodArena.eu" },
      {
        name: "description",
        content: "Проверка на тримесечния отчет, фактури и дигитално одобрение със 100% консенсус.",
      },
      { property: "og:title", content: "Контролен съвет — Одит и верификация | VhodArena.eu" },
      {
        property: "og:description",
        content: "Проверка на тримесечния отчет, фактури и дигитално одобрение със 100% консенсус.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupervisorPortal,
});
