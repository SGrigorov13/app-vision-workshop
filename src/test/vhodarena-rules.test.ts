import { describe, expect, it } from "vitest";

import { formatEUR } from "@/lib/format";
import { COLLECTION_BASE, INITIAL_APARTMENTS, INITIAL_EXPENSES, Q4_INCOME } from "@/lib/mock-data";
import { deriveReportStatus } from "@/lib/mock-store";
import { monthlyFee } from "@/lib/zues";

describe("VhodArena rules", () => {
  it("formats every amount in euro, never BGN", () => {
    expect(formatEUR(2850)).toBe("2\u00a0850,00\u00a0€");
    expect(formatEUR(38.5)).not.toMatch(/лв|BGN|\$/);
  });

  it("apartment 5 owes 18,00 € (чл. 51) + 20,50 € (чл. 50) = 38,50 €", () => {
    expect(monthlyFee(2, 1, 8.1)).toEqual({ maintenance: 18, repair: 20.5, total: 38.5 });
  });

  it("ideal parts of the 12 apartments add up to 100%", () => {
    const sum = INITIAL_APARTMENTS.reduce((s, a) => s + a.idealParts, 0);
    expect(INITIAL_APARTMENTS).toHaveLength(12);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });

  it("3 overdue apartments owe 234,00 € and collection is 84.2%", () => {
    const overdue = INITIAL_APARTMENTS.filter((a) => a.status === "unpaid");
    const total = overdue.reduce((s, a) => s + a.overdueAmount, 0);
    expect(overdue).toHaveLength(3);
    expect(Math.round(total * 100) / 100).toBe(234);
    expect(((COLLECTION_BASE.collected / COLLECTION_BASE.assessed) * 100).toFixed(1)).toBe("84.2");
  });

  it("Q4-2026: 4 446 € income − 1 920,30 € expenses = +2 525,70 €", () => {
    const expenses = Math.round(INITIAL_EXPENSES.reduce((s, e) => s + e.amount, 0) * 100) / 100;
    expect(expenses).toBe(1920.3);
    expect(Math.round((Q4_INCOME - expenses) * 100) / 100).toBe(2525.7);
  });

  it("report is approved only when every supervisor approves (100% consensus)", () => {
    expect(deriveReportStatus({ ivan: { status: "approved" }, elena: { status: "pending" } })).toBe("UNDER_REVIEW");
    expect(deriveReportStatus({ ivan: { status: "approved" }, elena: { status: "approved" } })).toBe("APPROVED");
    expect(deriveReportStatus({ ivan: { status: "rejected" }, elena: { status: "approved" } })).toBe("REJECTED");
  });
});
