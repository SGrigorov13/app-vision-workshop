import { describe, expect, it } from "vitest";

import { parseStatement } from "@/lib/bank-import";
import { accessStatus, subscriptionPrice } from "@/lib/billing";
import { boardApprovalRight, decisionStatus } from "@/lib/board";
import { buildInvites, decodeInvite, encodeInvite, type People } from "@/lib/invitations";
import { boardExpenseLimit, INITIAL_MEETINGS, type Meeting } from "@/lib/meetings";

describe("admin subscription", () => {
  it("up to 25 apartments costs €4.99/month and €49.99/year", () => {
    expect(subscriptionPrice(25, "monthly")).toBe(4.99);
    expect(subscriptionPrice(25, "annual")).toBe(49.99);
  });
  it("44 apartments costs €6.99/month and €69.99/year", () => {
    expect(subscriptionPrice(44, "monthly")).toBe(6.99);
    expect(subscriptionPrice(44, "annual")).toBe(69.99);
  });
  it("each started group of 10 above 25 adds €1/month", () => {
    expect(subscriptionPrice(26, "monthly")).toBe(5.99);
    expect(subscriptionPrice(35, "monthly")).toBe(5.99);
    expect(subscriptionPrice(36, "monthly")).toBe(6.99);
  });
  it("access is blocked after the 29th when next month is unpaid", () => {
    expect(accessStatus("2026-11", new Date(2026, 10, 29))).toBe("due");
    expect(accessStatus("2026-11", new Date(2026, 10, 30))).toBe("blocked");
    expect(accessStatus("2026-12", new Date(2026, 10, 30))).toBe("active");
    expect(accessStatus("2026-10", new Date(2026, 10, 5))).toBe("blocked");
  });
});

describe("registration invites", () => {
  const people: People = {
    manager: { id: "m", name: "Слави", email: "s@x.bg" },
    cashierSameAsManager: true,
    cashier: { id: "c", name: "", email: "" },
    board: [{ id: "b1", name: "Иван", email: "i@x.bg" }, { id: "b2", name: "Елена", email: "e@x.bg" }],
    residents: [{ id: "r1", name: "Мария", email: "m@x.bg", apartment: "2" }],
  };
  it("a cashier who is the manager gets one combined invite", () => {
    const inv = buildInvites(people, () => "t", "today");
    expect(inv).toHaveLength(4);
    expect(inv[0]!.roles).toEqual(["manager", "cashier"]);
  });
  it("invite token round-trips Cyrillic data", () => {
    const t = encodeInvite({ c: "ЕС България 58", a: "бул. България", r: ["board"], n: "Иван", e: "i@x.bg", i: "c:b1" });
    expect(decodeInvite(t)?.c).toBe("ЕС България 58");
  });
});

describe("supervisory board", () => {
  it("approves by majority of all members", () => {
    expect(decisionStatus({ a: "approve", b: "approve" }, 3)).toBe("approved");
    expect(decisionStatus({ a: "approve" }, 3)).toBe("pending");
    expect(decisionStatus({ a: "reject", b: "reject" }, 3)).toBe("rejected");
  });
  it("has no right to approve without a limit voted at an assembly", () => {
    expect(boardApprovalRight(100, null)).toBe("no_limit");
    expect(boardApprovalRight(301, 300)).toBe("over_limit");
    expect(boardApprovalRight(300, 300)).toBe("ok");
  });
  it("the limit comes from an adopted item of a finalized assembly", () => {
    const units = [{ no: 1, idealParts: 60 }, { no: 2, idealParts: 40 }];
    const m: Meeting = { ...INITIAL_MEETINGS[0]!, status: "finalized", attendance: { 1: "present", 2: "present" }, agenda: [{ id: "x", title: "", description: "", majority: "simple", discussion: "", votes: { 1: "for", 2: "against" }, expenseLimit: 300 }] };
    expect(boardExpenseLimit([m], units)).toBe(300);
    expect(boardExpenseLimit([{ ...m, status: "scheduled" }], units)).toBeNull();
  });
});

describe("bank statement import", () => {
  it("reads debit/credit columns with Bulgarian number format", () => {
    const r = parseStatement([
      ["Дата", "Основание", "Дебит", "Кредит"],
      ["01.12.2026", "Такса", "", "1 036,50"],
      ["05.12.2026", "Асансьор", "85,00", ""],
    ]);
    expect(r.rows).toEqual([
      { date: "2026-12-01", kind: "income", amount: 1036.5, note: "Такса", counterparty: "" },
      { date: "2026-12-05", kind: "expense", amount: 85, note: "Асансьор", counterparty: "" },
    ]);
  });
  it("reads a single signed amount column", () => {
    const r = parseStatement([["Date", "Amount", "Description"], ["2026-12-02", "-12.30", "Fee"]]);
    expect(r.rows[0]).toMatchObject({ kind: "expense", amount: 12.3 });
  });
});
