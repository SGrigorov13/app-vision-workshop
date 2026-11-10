import { describe, expect, it } from "vitest";

import { boxBalance, monthlyReports, periodOf, summarize, validateCondo, verify, type Tx } from "@/lib/treasury";

const txs: Tx[] = [
  { id: "1", date: "2026-10-01", kind: "income", amount: 100, box: "cash", note: "" },
  { id: "2", date: "2026-11-01", kind: "transfer", amount: 60, box: "cash", to: "bank", note: "" },
  { id: "3", date: "2026-12-01", kind: "expense", amount: 30, box: "bank", note: "" },
];

describe("cash boxes and reports", () => {
  it("transfers move money between cash and bank", () => {
    expect(boxBalance({ cash: 0, bank: 0 }, txs, "cash")).toBe(40);
    expect(boxBalance({ cash: 0, bank: 0 }, txs, "bank")).toBe(30);
  });
  it("monthly reports ignore internal transfers", () => {
    expect(monthlyReports(txs).map((r) => r.month)).toEqual(["2026-10", "2026-12"]);
  });
  it("months roll up into quarters and half-years", () => {
    expect(periodOf("2026-03", "Q")).toBe("2026-Q1");
    expect(periodOf("2026-07", "H")).toBe("2026-H2");
    expect(summarize(monthlyReports(txs), "Q")[0]).toMatchObject({ period: "2026-Q4", net: 70 });
  });
  it("board approves only when cash, bank and documents match", () => {
    const base = { period: "2026-Q4", countedCash: 40, bankStatement: 30, documentsChecked: true, remarks: "" };
    expect(verify(base, 40, 30)).toBe("approved");
    expect(verify({ ...base, countedCash: 39 }, 40, 30)).toBe("remarks");
    expect(verify({ ...base, documentsChecked: false }, 40, 30)).toBe("remarks");
  });
  it("condo registration needs name, address, units and a valid BG IBAN", () => {
    const c = { name: "ЕС", address: "ул. 1", city: "", postcode: "", bulstat: "", floors: 1, units: 4, iban: "BG80BNBG96611020345678", bic: "", manager: "Иван", cashier: "", board: "", mandateUntil: "" };
    expect(validateCondo(c)).toEqual([]);
    expect(validateCondo({ ...c, iban: "BG12" })).toEqual(["iban"]);
  });
});
