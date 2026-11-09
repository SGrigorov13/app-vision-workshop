import type { L } from "./i18n";
import { round2 } from "./format";

/** Attendance at a general assembly (ЗУЕС чл. 15). */
export type Attendance = "present" | "proxy" | "absent";
export type Vote = "for" | "against" | "abstain";

/**
 * Required majority for a decision (ЗУЕС чл. 17).
 * simple  – повече от 50% от представените идеални части
 * q67     – най-малко 67% от представените идеални части
 * q75     – най-малко 75% от идеалните части на цялата сграда
 * unanimous – всички собственици на сградата
 */
export type Majority = "simple" | "q67" | "q75" | "unanimous";

export const MAJORITY_LABEL: Record<Majority, L> = {
  simple: { bg: "Обикновено мнозинство (>50% от представените ид. ч.)", en: "Simple majority (>50% of represented parts)" },
  q67: { bg: "Мнозинство 67% от представените ид. ч.", en: "67% of represented parts" },
  q75: { bg: "Мнозинство 75% от ид. ч. на сградата", en: "75% of all building parts" },
  unanimous: { bg: "Единодушие на всички собственици", en: "Unanimity of all owners" },
};

/** Quorum thresholds (чл. 15): 67% initially, 51% after a one-hour postponement. */
export const QUORUM_FIRST = 67;
export const QUORUM_POSTPONED = 51;

export type Unit = { no: number; idealParts: number };

export function representedParts(units: Unit[], attendance: Record<number, Attendance>): number {
  return round2(units.reduce((s, u) => s + (attendance[u.no] && attendance[u.no] !== "absent" ? u.idealParts : 0), 0));
}

export function hasQuorum(represented: number, postponed: boolean): boolean {
  return represented >= (postponed ? QUORUM_POSTPONED : QUORUM_FIRST);
}

export type Tally = { for: number; against: number; abstain: number; forCount: number; againstCount: number; abstainCount: number };

export function tally(units: Unit[], attendance: Record<number, Attendance>, votes: Record<number, Vote>): Tally {
  const t: Tally = { for: 0, against: 0, abstain: 0, forCount: 0, againstCount: 0, abstainCount: 0 };
  for (const u of units) {
    if (!attendance[u.no] || attendance[u.no] === "absent") continue;
    const v = votes[u.no];
    if (!v) continue;
    t[v] = round2(t[v] + u.idealParts);
    t[`${v}Count` as const] += 1;
  }
  return t;
}

export function isAdopted(majority: Majority, t: Tally, represented: number, units: Unit[]): boolean {
  switch (majority) {
    case "simple":
      return t.for > represented / 2;
    case "q67":
      return t.for >= represented * 0.67;
    case "q75":
      return t.for >= 75;
    case "unanimous":
      return t.forCount === units.length;
  }
}

export type AgendaItem = {
  id: string;
  title: string;
  description: string;
  majority: Majority;
  discussion: string;
  votes: Record<number, Vote>;
};

export type MeetingStatus = "scheduled" | "in_progress" | "finalized";

export type Meeting = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  place: string;
  type: "regular" | "extraordinary";
  chair: string;
  secretary: string;
  postponed: boolean;
  status: MeetingStatus;
  attendance: Record<number, Attendance>;
  agenda: AgendaItem[];
  finalizedAt?: string;
};

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "m-2026-12",
    date: "2026-12-05",
    time: "18:30",
    place: "Входно фоайе, бул. България №58, вх. А",
    type: "regular",
    chair: "Слави Тодоров",
    secretary: "Мария Иванова",
    postponed: false,
    status: "scheduled",
    attendance: {},
    agenda: [
      { id: "a1", title: "Приемане на отчета на Домоуправителя за Q3–Q4 2026", description: "Обобщение на месечните отчети, проверени от Контролния съвет.", majority: "simple", discussion: "", votes: {} },
      { id: "a2", title: "Ремонт на покрива – избор на изпълнител", description: "Три оферти: 8 400 €, 9 150 €, 10 200 €. Финансиране от Фонд „Ремонт и обновяване“.", majority: "q67", discussion: "", votes: {} },
      { id: "a3", title: "Актуализация на месечната такса за поддръжка", description: "Предложение: от 7,20 € на 7,80 € на обитател.", majority: "simple", discussion: "", votes: {} },
    ],
  },
  {
    id: "m-2026-06",
    date: "2026-06-12",
    time: "19:00",
    place: "Входно фоайе, бул. България №58, вх. А",
    type: "regular",
    chair: "Слави Тодоров",
    secretary: "Георги Петров",
    postponed: false,
    status: "finalized",
    finalizedAt: "2026-06-12",
    attendance: { 1: "present", 2: "present", 3: "proxy", 4: "present", 5: "present", 6: "present", 7: "absent", 8: "present", 9: "proxy", 10: "present", 11: "absent", 12: "present" },
    agenda: [
      {
        id: "b1",
        title: "Избор на Домоуправител и Контролен съвет",
        description: "Мандат 2 години.",
        majority: "simple",
        discussion: "Предложени: Слави Тодоров (домоуправител), Иван Георгиев и Елена Димитрова (КС). Други кандидатури няма.",
        votes: { 1: "for", 2: "for", 3: "for", 4: "for", 5: "for", 6: "for", 8: "for", 9: "abstain", 10: "for", 12: "for" },
      },
      {
        id: "b2",
        title: "Подмяна на осветлението в общите части с LED",
        description: "Оферта 640 € от Фонд „Текущи разходи“.",
        majority: "simple",
        discussion: "Обсъдени датчици за движение. Ап. 12 против заради цената.",
        votes: { 1: "for", 2: "for", 3: "for", 4: "against", 5: "for", 6: "for", 8: "for", 9: "for", 10: "abstain", 12: "against" },
      },
    ],
  },
];
