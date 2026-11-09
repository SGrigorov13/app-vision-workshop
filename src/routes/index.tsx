import { createFileRoute } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";

import { ResidentApp } from "@/components/resident/ResidentApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VhodArena.eu — Приложение за живущи" },
      {
        name: "description",
        content: "Такси по ЗУЕС в евро, плащане с карта или SEPA, фондове на входа и сигнали за повреди.",
      },
      { property: "og:title", content: "VhodArena.eu — Приложение за живущи" },
      {
        property: "og:description",
        content: "Такси по ЗУЕС в евро, плащане с карта или SEPA, фондове на входа и сигнали за повреди.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative flex flex-1 flex-col bg-gradient-soft sm:items-center sm:justify-center sm:px-6 sm:py-10">
      <div className="flex w-full flex-1 flex-col sm:flex-none lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <div className="hidden max-w-sm lg:block">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Smartphone className="size-4" /> Android & Web приложение
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Вашият вход. Прозрачно, в евро.</h1>
          <p className="mt-4 text-muted-foreground">
            Платете месечната такса за секунди, вижте всеки фонд на живо и подайте сигнал за повреда със снимка.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>• Опитайте „Плати с карта“ или „SEPA / Банка“</li>
            <li>• Подайте сигнал за повреда</li>
            <li>• Сменете темата и гамата от „Профил“</li>
          </ul>
        </div>
        <ResidentApp />
      </div>
    </div>
  );
}
