import { createFileRoute } from "@tanstack/react-router";

import { ManagerDashboard } from "@/components/manager/ManagerDashboard";

export const Route = createFileRoute("/domoupravitel")({
  head: () => ({
    meta: [
      { title: "Табло на Домоуправителя — VhodArena.eu" },
      {
        name: "description",
        content: "Събираемост, просрочия, паричен поток, книга на задълженията и тримесечни отчети в евро.",
      },
      { property: "og:title", content: "Табло на Домоуправителя — VhodArena.eu" },
      {
        property: "og:description",
        content: "Събираемост, просрочия, паричен поток, книга на задълженията и тримесечни отчети в евро.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagerDashboard,
});
