import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { formatEUR, formatPercent, type Lang } from "./format";

export type { Lang };
/** A bilingual text. Plain strings (e.g. user input) render as-is in both languages. */
export type L = { bg: string; en: string };
export type Text = string | L;

export const LANG_STORAGE_KEY = "va-lang";

export function pick(text: Text, lang: Lang): string {
  return typeof text === "string" ? text : text[lang];
}

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** l("Начало", "Home") or l({ bg, en }) or l(userString) */
  l: (text: Text, en?: string) => string;
  eur: (amount: number, opts?: { sign?: boolean; decimals?: number }) => string;
  pct: (value: number, decimals?: number) => string;
};

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bg");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "en" || saved === "bg") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(LANG_STORAGE_KEY, next);
  }, []);

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      l: (text, en) => (typeof text === "string" && en !== undefined ? (lang === "bg" ? text : en) : pick(text, lang)),
      eur: (amount, opts = {}) => formatEUR(amount, { ...opts, lang }),
      pct: (value, decimals = 2) => formatPercent(value, decimals, lang),
    }),
    [lang, setLang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
