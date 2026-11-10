import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLang, type L, type Lang } from "@/lib/i18n";
import { PALETTES, useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const ROLES: Array<{ to: "/" | "/domoupravitel" | "/kontrolen-savet" | "/sabraniya" | "/kasi" | "/admin"; emoji: string; label: L; short: L }> = [
  { to: "/", emoji: "📱", label: { bg: "Живущ (Собственик)", en: "Resident (Owner)" }, short: { bg: "Живущ", en: "Resident" } },
  { to: "/domoupravitel", emoji: "💼", label: { bg: "Домоуправител", en: "Manager" }, short: { bg: "Домоуправител", en: "Manager" } },
  { to: "/kontrolen-savet", emoji: "⚖️", label: { bg: "Контролен съвет", en: "Supervisory Board" }, short: { bg: "Контр. съвет", en: "Board" } },
  { to: "/sabraniya", emoji: "🗳️", label: { bg: "Събрания", en: "Assemblies" }, short: { bg: "Събрания", en: "Assemblies" } },
  { to: "/kasi", emoji: "💶", label: { bg: "Каси и отчети", en: "Cash & reports" }, short: { bg: "Каси", en: "Cash" } },
  { to: "/admin", emoji: "🏢", label: { bg: "Регистрация ЕС", en: "Register condo" }, short: { bg: "Админ", en: "Admin" } },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { l } = useLang();

  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col lg:h-16 lg:flex-row lg:items-center lg:gap-6 lg:px-6">
        <div className="flex h-14 items-center justify-between px-4 lg:h-auto lg:px-0">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <Building2 className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              VhodArena<span className="text-muted-foreground">.eu</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 lg:hidden">
            <LangToggle />
            <PalettePicker />
            <ThemePicker />
          </div>
        </div>

        <nav
          aria-label={l("Избор на роля", "Choose role")}
          className="no-scrollbar flex h-12 items-center gap-1 overflow-x-auto px-3 lg:mx-auto lg:h-auto lg:px-0"
        >
          <div className="flex w-full gap-1 rounded-full bg-muted p-1 lg:w-auto">
            {ROLES.map((r) => {
              const active = r.to === "/" ? pathname === "/" : pathname.startsWith(r.to);
              return (
                <Link
                  key={r.to}
                  to={r.to}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm lg:flex-none lg:px-4",
                    active ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span aria-hidden>{r.emoji}</span>
                  <span className="sm:hidden">{l(r.short)}</span>
                  <span className="hidden sm:inline">{l(r.label)}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <LangToggle />
          <PalettePicker />
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: "bg", label: "БГ" },
  { id: "en", label: "EN" },
];

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang, l } = useLang();
  return (
    <div role="radiogroup" aria-label={l("Език", "Language")} className={cn("flex rounded-full bg-muted p-0.5", className)}>
      {LANGS.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={lang === o.id}
          onClick={() => setLang(o.id)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold transition-all",
            lang === o.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PalettePicker() {
  const { palette, setPalette } = useTheme();
  const { l } = useLang();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={l("Цветова гама", "Colour palette")}>
          <Palette />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-2xl p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {l("Цветова гама", "Colour palette")}
        </p>
        <div className="grid gap-1">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPalette(p.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted",
                palette === p.id && "bg-muted",
              )}
            >
              <span className="flex -space-x-1.5">
                {p.swatch.map((c) => (
                  <span
                    key={c}
                    className="size-6 rounded-full border-2 border-card"
                    // Swatch preview shows each palette's own colours, independent of the active theme.
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{l(p.name)}</span>
                <span className="block text-xs text-muted-foreground">{l(p.hint)}</span>
              </span>
              {palette === p.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const MODES: Array<{ id: ThemeMode; label: L; short: L; icon: typeof Sun }> = [
  { id: "system", label: { bg: "Като телефона", en: "Match phone" }, short: { bg: "Системна", en: "System" }, icon: Monitor },
  { id: "light", label: { bg: "Светла", en: "Light" }, short: { bg: "Светла", en: "Light" }, icon: Sun },
  { id: "dark", label: { bg: "Тъмна", en: "Dark" }, short: { bg: "Тъмна", en: "Dark" }, icon: Moon },
];

export function ThemePicker() {
  const { mode, resolved, setMode } = useTheme();
  const { l } = useLang();
  const Icon = mode === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={l("Тема", "Theme")}>
          <Icon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-2xl p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {l("Тема", "Theme")}
        </p>
        <div className="grid gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                mode === m.id && "bg-muted",
              )}
            >
              <m.icon className="size-4 text-muted-foreground" />
              <span className="flex-1 text-left">{l(m.label)}</span>
              {mode === m.id && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ThemeModeSegmented({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  const { l } = useLang();
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all",
            mode === m.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
          )}
        >
          <m.icon className="size-4" />
          {l(m.short)}
        </button>
      ))}
    </div>
  );
}
