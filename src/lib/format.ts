export type Lang = "bg" | "en";

/**
 * Deterministic EUR formatting (identical on server and client — no Intl).
 * bg: 2850 -> "2 850,00 €"   en: 2850 -> "€2,850.00"
 */
export function formatEUR(
  amount: number,
  opts: { sign?: boolean; decimals?: number; lang?: Lang } = {},
): string {
  const decimals = opts.decimals ?? 2;
  const lang = opts.lang ?? "bg";
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(decimals);
  const [int = "0", dec] = fixed.split(".");
  const group = lang === "bg" ? "\u00a0" : ",";
  const decSep = lang === "bg" ? "," : ".";
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const body = dec ? `${intGrouped}${decSep}${dec}` : intGrouped;
  const prefix = negative ? "−\u00a0" : opts.sign ? "+\u00a0" : "";
  return lang === "bg" ? `${prefix}${body}\u00a0€` : `${prefix}€${body}`;
}

export function formatPercent(value: number, decimals = 2, lang: Lang = "bg"): string {
  const s = value.toFixed(decimals);
  return `${lang === "bg" ? s.replace(".", ",") : s}%`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
