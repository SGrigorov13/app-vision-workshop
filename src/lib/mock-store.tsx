import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  COLLECTION_BASE,
  CURRENT_PERIOD,
  CURRENT_USER,
  INITIAL_APARTMENTS,
  INITIAL_EXPENSES,
  INITIAL_FUNDS,
  INITIAL_PAYMENTS,
  INITIAL_TICKETS,
  Q4_INCOME,
  type Apartment,
  type Expense,
  type FundKey,
  type ResidentPayment,
  type Ticket,
} from "./mock-data";
import { round2 } from "./format";

export type VoteState = { status: "pending" | "voting" | "approved" | "rejected"; hash?: string; at?: string };
export type ReportStatus = "UNDER_REVIEW" | "APPROVED" | "REJECTED";

type State = {
  apartments: Apartment[];
  funds: Record<FundKey, number>;
  collected: number;
  expenses: Expense[];
  tickets: Ticket[];
  payments: ResidentPayment[];
  votes: Record<"ivan" | "elena", VoteState>;
  rejectComment?: string | undefined;
  reportSentAt?: string | undefined;
};

const initialState = (): State => ({
  apartments: INITIAL_APARTMENTS.map((a) => ({ ...a })),
  funds: { ...INITIAL_FUNDS },
  collected: COLLECTION_BASE.collected,
  expenses: [...INITIAL_EXPENSES],
  tickets: [...INITIAL_TICKETS],
  payments: [...INITIAL_PAYMENTS],
  votes: { ivan: { status: "pending" }, elena: { status: "pending" } },
  reportSentAt: "01.01.2027",
});

export function deriveReportStatus(votes: State["votes"]): ReportStatus {
  const all = Object.values(votes);
  if (all.some((v) => v.status === "rejected")) return "REJECTED";
  if (all.every((v) => v.status === "approved")) return "APPROVED";
  return "UNDER_REVIEW";
}

function nowLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function useStoreValue() {
  const [state, setState] = useState<State>(initialState);

  const payApartment = useCallback((no: number, method: ResidentPayment["method"]) => {
    setState((s) => {
      const apt = s.apartments.find((a) => a.no === no);
      if (!apt || apt.status === "paid") return s;
      const months = apt.overdueMonths || 1;
      return {
        ...s,
        apartments: s.apartments.map((a) =>
          a.no === no ? { ...a, status: "paid", overdueMonths: 0, overdueAmount: 0 } : a,
        ),
        collected: round2(s.collected + apt.overdueAmount),
        funds: {
          ...s.funds,
          current: round2(s.funds.current + apt.maintenance * months),
          repair: round2(s.funds.repair + apt.repair * months),
        },
        payments:
          no === CURRENT_USER.apartment
            ? [
                { id: `p-${Date.now()}`, period: CURRENT_PERIOD, amount: apt.overdueAmount, date: nowLabel().slice(0, 10), method },
                ...s.payments,
              ]
            : s.payments,
      };
    });
  }, []);

  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    setState((s) => ({
      ...s,
      expenses: [...s.expenses, { ...e, id: `e-${Date.now()}` }],
      funds: { ...s.funds, [e.fund]: round2(s.funds[e.fund] - e.amount) },
    }));
  }, []);

  const addTicket = useCallback((t: Omit<Ticket, "id" | "createdAt" | "status">) => {
    const id = `T-${1039 + Math.floor(Math.random() * 900)}`;
    setState((s) => ({
      ...s,
      tickets: [{ ...t, id, createdAt: nowLabel().slice(0, 10), status: "new" }, ...s.tickets],
    }));
    return id;
  }, []);

  const sendReport = useCallback(() => {
    setState((s) => ({
      ...s,
      reportSentAt: nowLabel(),
      votes: { ivan: { status: "pending" }, elena: { status: "pending" } },
      rejectComment: undefined,
    }));
  }, []);

  const castVote = useCallback(
    async (who: "ivan" | "elena") => {
      setState((s) => ({ ...s, votes: { ...s.votes, [who]: { status: "voting" } } }));
      const payload = JSON.stringify({
        report: "Q4-2026",
        income: Q4_INCOME,
        expenses: state.expenses.map((e) => [e.id, e.amount]),
        voter: who,
        ts: Date.now(),
      });
      const [hash] = await Promise.all([sha256(payload), new Promise((r) => setTimeout(r, 1100))]);
      setState((s) => ({
        ...s,
        votes: { ...s.votes, [who]: { status: "approved", hash, at: nowLabel() } },
      }));
      return hash;
    },
    [state.expenses],
  );

  const rejectReport = useCallback((comment: string) => {
    setState((s) => ({
      ...s,
      rejectComment: comment,
      votes: { ...s.votes, ivan: { status: "rejected", at: nowLabel() } },
    }));
  }, []);

  const resetReport = useCallback(() => {
    setState((s) => ({
      ...s,
      votes: { ivan: { status: "pending" }, elena: { status: "pending" } },
      rejectComment: undefined,
    }));
  }, []);

  const resetAll = useCallback(() => setState(initialState()), []);

  const derived = useMemo(() => {
    const overdue = state.apartments.filter((a) => a.status === "unpaid");
    const expensesTotal = round2(state.expenses.reduce((sum, e) => sum + e.amount, 0));
    return {
      overdueUnits: overdue.length,
      overdueTotal: round2(overdue.reduce((sum, a) => sum + a.overdueAmount, 0)),
      collectionRate: (state.collected / COLLECTION_BASE.assessed) * 100,
      assessed: COLLECTION_BASE.assessed,
      expensesTotal,
      income: Q4_INCOME,
      net: round2(Q4_INCOME - expensesTotal),
      reportStatus: deriveReportStatus(state.votes),
      myApartment: state.apartments.find((a) => a.no === CURRENT_USER.apartment)!,
    };
  }, [state]);

  return {
    state,
    derived,
    payApartment,
    addExpense,
    addTicket,
    sendReport,
    castVote,
    rejectReport,
    resetReport,
    resetAll,
  };
}

type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useMockStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useMockStore must be used within MockStoreProvider");
  return ctx;
}
