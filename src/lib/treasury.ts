import type { L } from "./i18n";
import { round2 } from "./format";

export type CashboxId = "cash" | "bank";
export const CASHBOX_LABEL: Record<CashboxId, L> = {
  cash: { bg: "Каса в брой", en: "Cash box" },
  bank: { bg: "Каса банка", en: "Bank account" },
};

export type TxKind = "income" | "expense" | "transfer";
export type Tx = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: TxKind;
  amount: number;
  box: CashboxId; // for transfer: source box
  to?: CashboxId; // transfer target
  note: string;
};

export function boxBalance(opening: Record<CashboxId, number>, txs: Tx[], box: CashboxId): number {
  let b = opening[box];
  for (const t of txs) {
    if (t.kind === "income" && t.box === box) b += t.amount;
    if (t.kind === "expense" && t.box === box) b -= t.amount;
    if (t.kind === "transfer") {
      if (t.box === box) b -= t.amount;
      if (t.to === box) b += t.amount;
    }
  }
  return round2(b);
}

export type MonthReport = { month: string; income: number; expense: number; net: number };

/** Monthly report — transfers between own boxes are not income or expense. */
export function monthlyReports(txs: Tx[]): MonthReport[] {
  const map = new Map<string, MonthReport>();
  for (const t of txs) {
    if (t.kind === "transfer") continue;
    const m = t.date.slice(0, 7);
    const r = map.get(m) ?? { month: m, income: 0, expense: 0, net: 0 };
    if (t.kind === "income") r.income += t.amount;
    else r.expense += t.amount;
    map.set(m, r);
  }
  return [...map.values()]
    .map((r) => ({ ...r, income: round2(r.income), expense: round2(r.expense), net: round2(r.income - r.expense) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export type PeriodKind = "Q" | "H";
/** Period key: "2026-Q4" (3 months) or "2026-H2" (6 months). */
export function periodOf(month: string, kind: PeriodKind): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return kind === "Q" ? `${y}-Q${Math.ceil(m / 3)}` : `${y}-H${m <= 6 ? 1 : 2}`;
}

export function summarize(reports: MonthReport[], kind: PeriodKind) {
  const map = new Map<string, { period: string; months: string[]; income: number; expense: number; net: number }>();
  for (const r of reports) {
    const p = periodOf(r.month, kind);
    const s = map.get(p) ?? { period: p, months: [], income: 0, expense: 0, net: 0 };
    s.months.push(r.month);
    s.income = round2(s.income + r.income);
    s.expense = round2(s.expense + r.expense);
    s.net = round2(s.income - s.expense);
    map.set(p, s);
  }
  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export type VerificationStatus = "pending" | "approved" | "remarks";
export type Verification = {
  period: string;
  countedCash: number;
  bankStatement: number;
  documentsChecked: boolean;
  remarks: string;
  status: VerificationStatus;
  signedAt?: string;
};

/** Board approves only if counted cash and bank statement match the books and all documents are checked. */
export function verify(v: Omit<Verification, "status">, bookCash: number, bookBank: number): VerificationStatus {
  const ok = round2(v.countedCash) === round2(bookCash) && round2(v.bankStatement) === round2(bookBank) && v.documentsChecked;
  return ok ? "approved" : "remarks";
}

export const OPENING: Record<CashboxId, number> = { cash: 320, bank: 6850 };

export const INITIAL_TXS: Tx[] = [
  { id: "t1", date: "2026-07-10", kind: "income", amount: 1455, box: "bank", note: "Такси юли" },
  { id: "t2", date: "2026-07-20", kind: "expense", amount: 612, box: "bank", note: "Ток, асансьор, почистване" },
  { id: "t3", date: "2026-08-10", kind: "income", amount: 1390, box: "bank", note: "Такси август" },
  { id: "t4", date: "2026-08-25", kind: "expense", amount: 1045, box: "bank", note: "Ремонт врата" },
  { id: "t5", date: "2026-09-10", kind: "income", amount: 1402, box: "bank", note: "Такси септември" },
  { id: "t6", date: "2026-09-12", kind: "income", amount: 80, box: "cash", note: "Такси в брой" },
  { id: "t7", date: "2026-09-28", kind: "expense", amount: 640, box: "bank", note: "Текущи разходи" },
  { id: "t8", date: "2026-10-11", kind: "income", amount: 1390, box: "bank", note: "Такси октомври" },
  { id: "t9", date: "2026-10-11", kind: "income", amount: 80, box: "cash", note: "Такси в брой" },
  { id: "t10", date: "2026-10-18", kind: "expense", amount: 36.3, box: "cash", note: "Крушки" },
  { id: "t11", date: "2026-10-30", kind: "expense", amount: 370, box: "bank", note: "Почистване, ток" },
  { id: "t12", date: "2026-11-05", kind: "transfer", amount: 200, box: "cash", to: "bank", note: "Внасяне в банка" },
  { id: "t13", date: "2026-11-12", kind: "income", amount: 1248, box: "bank", note: "Такси ноември" },
  { id: "t14", date: "2026-11-20", kind: "expense", amount: 1294, box: "bank", note: "Асансьор — ремонт" },
];

export type Condo = {
  name: string;
  address: string;
  city: string;
  postcode: string;
  bulstat: string;
  floors: number;
  units: number;
  iban: string;
  bic: string;
  manager: string;
  cashier: string;
  board: string;
  mandateUntil: string;
};

export function validateCondo(c: Condo): string[] {
  const errs: string[] = [];
  if (!c.name.trim()) errs.push("name");
  if (!c.address.trim()) errs.push("address");
  if (c.units < 1) errs.push("units");
  if (c.iban && !/^BG\d{2}[A-Z]{4}\d{6}[A-Z0-9]{8}$/.test(c.iban.replace(/\s/g, "").toUpperCase())) errs.push("iban");
  if (!c.manager.trim()) errs.push("manager");
  return errs;
}
