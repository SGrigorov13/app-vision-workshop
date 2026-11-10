import { round2 } from "./format";

export type StatementRow = {
  date: string; // YYYY-MM-DD
  kind: "income" | "expense";
  amount: number; // always positive
  note: string;
  counterparty: string;
};

export type ParseResult = { rows: StatementRow[]; skipped: number; error?: "no_header" | "no_columns" };

const H = {
  date: /^(дата|date|вальор|value date|дата на операция|booking date|transaction date)/i,
  debit: /(дебит|debit|разход|изходящ|теглене|withdraw)/i,
  credit: /(кредит|credit|приход|входящ|постъпл|deposit)/i,
  amount: /(сума|amount|стойност)/i,
  dir: /^(д\/к|d\/c|dc|тип|type|посока|direction)$/i,
  note: /(основание|описание|description|details|reference|детайли|информация|purpose)/i,
  party: /(контрагент|наредител|получател|counterparty|beneficiary|payer|име|name)/i,
};

const pad = (n: number) => String(n).padStart(2, "0");

export function parseDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial date (1900 system)
    const d = new Date(Math.round((v - 25569) * 864e5));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) return `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`;
  return null;
}

export function parseAmount(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.replace(/[€\s\u00a0]|EUR|BGN/gi, "").replace(/−/g, "-");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Turns spreadsheet rows (array of arrays) from a bank statement into income/expense rows. */
export function parseStatement(rows: unknown[][]): ParseResult {
  const headerIdx = rows.slice(0, 20).findIndex((r) => r.some((c) => typeof c === "string" && H.date.test(c.trim())));
  if (headerIdx < 0) return { rows: [], skipped: 0, error: "no_header" };
  const header = rows[headerIdx]!.map((c) => (typeof c === "string" ? c.trim() : String(c ?? "")));
  const find = (re: RegExp, exclude: number[] = []) => header.findIndex((h, i) => !exclude.includes(i) && re.test(h));

  const date = find(H.date);
  const debit = find(H.debit, [date]);
  const credit = find(H.credit, [date, debit]);
  const dir = find(H.dir);
  const amount = find(H.amount, [date, debit, credit]);
  const note = find(H.note);
  const party = find(H.party, [note]);
  if (debit < 0 && credit < 0 && amount < 0) return { rows: [], skipped: 0, error: "no_columns" };

  const out: StatementRow[] = [];
  let skipped = 0;
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r || r.every((c) => c === null || c === undefined || c === "")) continue;
    const d = parseDate(r[date]);
    let signed: number | null = null;
    if (debit >= 0 || credit >= 0) {
      const de = debit >= 0 ? parseAmount(r[debit]) : null;
      const cr = credit >= 0 ? parseAmount(r[credit]) : null;
      if (cr) signed = Math.abs(cr);
      else if (de) signed = -Math.abs(de);
    } else {
      signed = parseAmount(r[amount]);
      const flag = dir >= 0 ? String(r[dir] ?? "").trim().toLowerCase() : "";
      if (signed !== null && flag) {
        const isDebit = /^(д|d|debit|дебит|разход)/.test(flag);
        signed = isDebit ? -Math.abs(signed) : Math.abs(signed);
      }
    }
    if (!d || !signed) {
      skipped++;
      continue;
    }
    out.push({
      date: d,
      kind: signed > 0 ? "income" : "expense",
      amount: round2(Math.abs(signed)),
      note: note >= 0 ? String(r[note] ?? "").trim() : "",
      counterparty: party >= 0 ? String(r[party] ?? "").trim() : "",
    });
  }
  return { rows: out, skipped };
}

/** A statement row already in the books (same date, direction and amount). */
export function isDuplicate(
  row: StatementRow,
  existing: Array<{ date: string; kind: string; amount: number; box: string }>,
): boolean {
  return existing.some((t) => t.box === "bank" && t.date === row.date && t.kind === row.kind && round2(t.amount) === row.amount);
}

/** Demo statement (Bulgarian bank layout) for the "download sample" button. */
export function sampleStatement(): unknown[][] {
  return [
    ["Извлечение по сметка BG80BNBG91651000123456", "", "", "", ""],
    ["Дата", "Контрагент", "Основание", "Дебит", "Кредит"],
    ["01.12.2026", "Георги Петров", "Такса декември ап. 1", "", "36,00"],
    ["02.12.2026", "Мария Иванова", "Такса декември ап. 2", "", "31,90"],
    ["03.12.2026", "Нели Колева", "Такса декември ап. 6", "", "50,70"],
    ["05.12.2026", "Лифт Сервиз ООД", "Абонамент асансьор 12/2026", "85,00", ""],
    ["05.12.2026", "Чисто Вход ЕООД", "Почистване 12/2026", "90,00", ""],
    ["08.12.2026", "Банка", "Такса обслужване сметка", "2,50", ""],
  ];
}
