import type { L } from "./i18n";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type PaletteId = "revolut" | "coral" | "emerald" | "lime" | "ocean";

export const PALETTES: Array<{ id: PaletteId; name: L; hint: L; swatch: [string, string, string] }> = [
  { id: "revolut", name: { bg: "Нощно синьо", en: "Midnight blue" }, hint: { bg: "Revolut стил", en: "Revolut style" }, swatch: ["#0b0d12", "#2b6cff", "#38bdf8"] },
  { id: "coral", name: { bg: "Корал", en: "Coral" }, hint: { bg: "Airbnb стил", en: "Airbnb style" }, swatch: ["#ffffff", "#ff385c", "#f59e0b"] },
  { id: "emerald", name: { bg: "Изумруд и злато", en: "Emerald & gold" }, hint: { bg: "Доверие и стабилност", en: "Trust and stability" }, swatch: ["#064e3b", "#0d7a5f", "#c9a84c"] },
  { id: "lime", name: { bg: "Графит и лайм", en: "Graphite & lime" }, hint: { bg: "Смел и модерен", en: "Bold and modern" }, swatch: ["#1c1f1a", "#3a3f36", "#c6f432"] },
  { id: "ocean", name: { bg: "Океан", en: "Ocean" }, hint: { bg: "Спокоен и професионален", en: "Calm and professional" }, swatch: ["#0c2340", "#1a6e9e", "#5cbdb9"] },
];

export const THEME_STORAGE_KEY = "va-theme";
export const PALETTE_STORAGE_KEY = "va-palette";

/** Runs before paint (inlined in <head>) so the saved theme applies with no flash. */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var p=localStorage.getItem('${PALETTE_STORAGE_KEY}')||'revolut';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.setAttribute('data-palette',p);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

type ThemeCtx = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  palette: PaletteId;
  setMode: (m: ThemeMode) => void;
  setPalette: (p: PaletteId) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [palette, setPaletteState] = useState<PaletteId>("revolut");
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const m = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "system";
    const p = (localStorage.getItem(PALETTE_STORAGE_KEY) as PaletteId | null) ?? "revolut";
    setModeState(m);
    setPaletteState(p);
    setSystemDark(systemPrefersDark());
    setReady(true);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: "light" | "dark" = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    el.classList.toggle("dark", resolved === "dark");
    el.style.colorScheme = resolved;
    el.setAttribute("data-palette", palette);
  }, [resolved, palette, ready]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(THEME_STORAGE_KEY, m);
  }, []);

  const setPalette = useCallback((p: PaletteId) => {
    setPaletteState(p);
    localStorage.setItem(PALETTE_STORAGE_KEY, p);
  }, []);

  return <Ctx.Provider value={{ mode, resolved, palette, setMode, setPalette }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
