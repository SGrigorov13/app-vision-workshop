import { createFileRoute } from "@tanstack/react-router";

import { TreasuryModule } from "@/components/treasury/TreasuryModule";

export const Route = createFileRoute("/kasi")({
  head: () => ({
    meta: [
      { title: "Каси и отчети — VhodArena.eu" },
      { name: "description", content: "Каса в брой и банка, месечни отчети, обобщения на 3/6 месеца и проверка от Контролния съвет." },
      { property: "og:title", content: "Каси и отчети — VhodArena.eu" },
      { property: "og:description", content: "Каса в брой и банка, месечни отчети и проверка от Контролния съвет." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TreasuryModule,
});
