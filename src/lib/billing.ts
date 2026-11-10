import { round2 } from "./format";

/** Admin subscription for one condominium. All amounts in EUR. */
export type Plan = "monthly" | "annual";

export const BASE_UNITS = 25;
export const STEP_UNITS = 10;
export const PRICE = {
  monthly: { base: 4.99, step: 1 },
  annual: { base: 49.99, step: 10 },
} as const satisfies Record<Plan, { base: number; step: number }>;
/** Next month must be paid by this day of the current month. */
export const PAY_DEADLINE_DAY = 29;

/** Every started group of 10 apartments above 25 adds one price step. */
export function extraBlocks(units: number): number {
  return units <= BASE_UNITS ? 0 : Math.ceil((units - BASE_UNITS) / STEP_UNITS);
}

export function subscriptionPrice(units: number, plan: Plan): number {
  const p = PRICE[plan];
  return round2(p.base + extraBlocks(units) * p.step);
}

export function planMonths(plan: Plan): number {
  return plan === "annual" ? 12 : 1;
}

/** "YYYY-MM" */
export type YearMonth = string;

export function ymOf(d: Date): YearMonth {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export type AccessStatus = "active" | "due" | "blocked";

/**
 * paidThrough = last month that is paid.
 * - blocked: the current month is unpaid, or it is after the 29th and next month is unpaid.
 * - due: next month is unpaid but the 29th has not passed yet.
 */
export function accessStatus(paidThrough: YearMonth, today: Date): AccessStatus {
  const cur = ymOf(today);
  const next = addMonths(cur, 1);
  const required = today.getDate() > PAY_DEADLINE_DAY ? next : cur;
  if (paidThrough < required) return "blocked";
  if (paidThrough < next) return "due";
  return "active";
}

/** Deadline (29th) to pay the month after paidThrough, as DD.MM.YYYY. */
export function nextDeadline(paidThrough: YearMonth): string {
  const [y, m] = paidThrough.split("-");
  return `${PAY_DEADLINE_DAY}.${m}.${y}`;
}
