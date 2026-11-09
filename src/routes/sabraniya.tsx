import { createFileRoute } from "@tanstack/react-router";

import { MeetingsModule } from "@/components/meetings/MeetingsModule";

export const Route = createFileRoute("/sabraniya")({
  head: () => ({
    meta: [
      { title: "Общи събрания и протоколи — VhodArena.eu" },
      { name: "description", content: "Дневен ред, кворум, гласуване по идеални части и протокол за печат по ЗУЕС." },
      { property: "og:title", content: "Общи събрания и протоколи — VhodArena.eu" },
      { property: "og:description", content: "Дневен ред, кворум, гласуване по идеални части и протокол за печат по ЗУЕС." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetingsModule,
});
