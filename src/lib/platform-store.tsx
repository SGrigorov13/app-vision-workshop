import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { accessStatus, addMonths, planMonths, subscriptionPrice, type AccessStatus, type Plan, type YearMonth } from "./billing";
import { buildInvites, encodeInvite, type Invite, type People } from "./invitations";
import { BUILDING } from "./mock-data";

export type Building = {
  name: string;
  address: string;
  city: string;
  postcode: string;
  bulstat: string;
  floors: number;
  units: number;
  iban: string;
  bic: string;
  mandateUntil: string;
};

export type SubscriptionPayment = { id: string; date: string; plan: Plan; amount: number; from: YearMonth; to: YearMonth };

export type CondoRecord = Building & {
  id: string;
  isDemo?: boolean;
  cashEnabled: boolean;
  people: People;
  invites: Invite[];
  plan: Plan;
  paidThrough: YearMonth;
  payments: SubscriptionPayment[];
  createdAt: string;
};

const p = (id: string, name: string, email: string) => ({ id, name, email });

const DEMO_CONDO: CondoRecord = {
  id: "demo",
  isDemo: true,
  name: BUILDING.beneficiary.bg,
  address: BUILDING.address.bg,
  city: BUILDING.city.bg,
  postcode: "1404",
  bulstat: "177345120",
  floors: 6,
  units: 12,
  iban: BUILDING.iban,
  bic: "BNBGBGSD",
  mandateUntil: "2028-06-12",
  cashEnabled: true,
  people: {
    manager: p("m", "Слави Тодоров", "slavi@vhodarena.eu"),
    cashierSameAsManager: true,
    cashier: p("c", "", ""),
    board: [p("b1", "Иван Георгиев", "ivan.g@example.com"), p("b2", "Елена Димитрова", "elena.d@example.com"), p("b3", "Петър Димитров", "petar.d@example.com")],
    residents: [p("r1", "Георги Петров", "georgi.p@example.com"), p("r2", "Мария Иванова", "maria.i@example.com")].map((r, i) => ({ ...r, apartment: String(i + 1) })),
  },
  invites: [],
  plan: "monthly",
  paidThrough: "2026-11",
  payments: [{ id: "sp1", date: "27.10.2026", plan: "monthly", amount: 4.99, from: "2026-11", to: "2026-11" }],
  createdAt: "01.06.2026",
};

const EXTRA_CONDOS: CondoRecord[] = [
  {
    ...DEMO_CONDO,
    id: "mladost",
    isDemo: false,
    name: "ЕС ж.к. Младост 1, бл. 12",
    address: "ж.к. Младост 1, бл. 12",
    postcode: "1784",
    bulstat: "",
    floors: 11,
    units: 44,
    iban: "BG18RZBB91550123456789",
    bic: "RZBBBGSF",
    plan: "annual",
    paidThrough: "2027-03",
    payments: [{ id: "sp2", date: "28.03.2026", plan: "annual", amount: 69.99, from: "2026-04", to: "2027-03" }],
    createdAt: "28.03.2026",
  },
  {
    ...DEMO_CONDO,
    id: "shipka",
    isDemo: false,
    name: "ЕС ул. Шипка 7",
    address: "ул. Шипка 7",
    postcode: "1504",
    bulstat: "",
    floors: 5,
    units: 18,
    iban: "",
    bic: "",
    cashEnabled: false,
    plan: "monthly",
    paidThrough: "2026-10",
    payments: [{ id: "sp3", date: "29.09.2026", plan: "monthly", amount: 4.99, from: "2026-10", to: "2026-10" }],
    createdAt: "12.09.2026",
  },
];

function todayLabel(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function makeInviteUrl(token: string) {
  const origin = typeof window === "undefined" ? "https://vhodarena.eu" : window.location.origin;
  return `${origin}/pokana/${token}`;
}

function usePlatformValue() {
  const [condos, setCondos] = useState<CondoRecord[]>(() => [DEMO_CONDO, ...EXTRA_CONDOS]);
  const [activeId, setActiveId] = useState("demo");
  /** Demo override of "today" so the 29th-of-month blocking can be tried out. */
  const [demoDate, setDemoDate] = useState<string | null>(null);
  const today = useMemo(() => (demoDate ? new Date(`${demoDate}T12:00:00`) : new Date()), [demoDate]);

  const update = useCallback((id: string, fn: (c: CondoRecord) => CondoRecord) => {
    setCondos((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const registerCondo = useCallback((b: Building, people: People, plan: Plan, cashEnabled: boolean) => {
    const id = `c-${Date.now()}`;
    const sentAt = todayLabel();
    const invites = buildInvites(
      people,
      (x) => encodeInvite({ c: b.name, a: b.address, r: x.roles, n: x.name, e: x.email, ap: x.apartment, i: `${id}:${x.id}` }),
      sentAt,
    );
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const months = planMonths(plan);
    const amount = subscriptionPrice(b.units, plan);
    const condo: CondoRecord = {
      ...b,
      id,
      cashEnabled,
      people,
      invites,
      plan,
      paidThrough: addMonths(cur, months - 1),
      payments: [{ id: `sp-${Date.now()}`, date: sentAt, plan, amount, from: cur, to: addMonths(cur, months - 1) }],
      createdAt: sentAt,
    };
    setCondos((cs) => [...cs, condo]);
    return condo;
  }, []);

  const paySubscription = useCallback(
    (id: string, plan: Plan) => {
      update(id, (c) => {
        const from = addMonths(c.paidThrough, 1);
        const to = addMonths(c.paidThrough, planMonths(plan));
        const amount = subscriptionPrice(c.units, plan);
        return { ...c, plan, paidThrough: to, payments: [{ id: `sp-${Date.now()}`, date: todayLabel(), plan, amount, from, to }, ...c.payments] };
      });
    },
    [update],
  );

  const acceptInvite = useCallback((ref: string) => {
    const [condoId, personId] = ref.split(":");
    setCondos((cs) =>
      cs.map((c) => (c.id === condoId ? { ...c, invites: c.invites.map((i) => (i.id === personId ? { ...i, status: "accepted" } : i)) } : c)),
    );
  }, []);

  const active = condos.find((c) => c.id === activeId) ?? condos[0]!;
  const statusOf = useCallback((c: CondoRecord): AccessStatus => accessStatus(c.paidThrough, today), [today]);

  return {
    condos,
    active,
    activeStatus: statusOf(active),
    statusOf,
    setActiveId,
    today,
    demoDate,
    setDemoDate,
    registerCondo,
    paySubscription,
    setCashEnabled: (id: string, on: boolean) => update(id, (c) => ({ ...c, cashEnabled: on })),
    acceptInvite,
  };
}

type Platform = ReturnType<typeof usePlatformValue>;
const Ctx = createContext<Platform | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const value = usePlatformValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
