export type BoardVote = "approve" | "reject";
export type DecisionStatus = "pending" | "approved" | "rejected";

/** Majority of the supervisory board members: more than half of all members. */
export function hasMajority(yes: number, members: number): boolean {
  return members > 0 && yes > members / 2;
}

/** Approved once a majority approves; rejected once a majority can no longer be reached. */
export function decisionStatus(votes: Record<string, BoardVote>, members: number): DecisionStatus {
  const all = Object.values(votes);
  const approve = all.filter((v) => v === "approve").length;
  if (hasMajority(approve, members)) return "approved";
  const remaining = members - all.length;
  if (!hasMajority(approve + remaining, members)) return "rejected";
  return "pending";
}

export type ApprovalRight = "no_limit" | "over_limit" | "ok";

/** The board may approve a current expense only up to the limit voted by the general assembly. */
export function boardApprovalRight(amount: number, limit: number | null): ApprovalRight {
  if (limit === null || limit <= 0) return "no_limit";
  if (amount > limit) return "over_limit";
  return "ok";
}
