import { describe, expect, it } from "vitest";

import { hasQuorum, isAdopted, representedParts, tally, type Attendance } from "@/lib/meetings";

const units = [
  { no: 1, idealParts: 40 },
  { no: 2, idealParts: 30 },
  { no: 3, idealParts: 30 },
];

describe("ЗУЕС assembly rules", () => {
  it("quorum needs 67% of ideal parts, or 51% after a 1-hour postponement", () => {
    expect(hasQuorum(66.99, false)).toBe(false);
    expect(hasQuorum(67, false)).toBe(true);
    expect(hasQuorum(51, true)).toBe(true);
    expect(hasQuorum(50.99, true)).toBe(false);
  });

  it("proxies count as represented, absentees do not", () => {
    const att: Record<number, Attendance> = { 1: "present", 2: "proxy", 3: "absent" };
    expect(representedParts(units, att)).toBe(70);
  });

  it("simple majority needs more than half of the represented parts", () => {
    const att: Record<number, Attendance> = { 1: "present", 2: "present" };
    const t = tally(units, att, { 1: "for", 2: "against" });
    expect(isAdopted("simple", t, 70, units)).toBe(true); // 40 > 35
    const t2 = tally(units, att, { 1: "against", 2: "for" });
    expect(isAdopted("simple", t2, 70, units)).toBe(false);
  });

  it("75% decisions count against the whole building", () => {
    const att: Record<number, Attendance> = { 1: "present", 2: "present" };
    const t = tally(units, att, { 1: "for", 2: "for" });
    expect(isAdopted("q75", t, 70, units)).toBe(false);
  });
});
