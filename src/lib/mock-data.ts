import type { L, Text } from "./i18n";
import { monthlyFee } from "./zues";

export const BUILDING = {
  address: { bg: "бул. България №58, Вход А", en: "58 Bulgaria Blvd, Entrance A" } as L,
  city: { bg: "София", en: "Sofia" } as L,
  iban: "BG80BNBG91651000123456",
  beneficiary: { bg: "ЕС бул. България 58, вх. А", en: "Condominium 58 Bulgaria Blvd, Ent. A" } as L,
  bank: "БНБ",
};

export const CURRENT_USER = {
  name: { bg: "Слави Тодоров", en: "Slavi Todorov" } as L,
  firstName: { bg: "Слави", en: "Slavi" } as L,
  initials: { bg: "СТ", en: "ST" } as L,
  apartment: 5,
  floor: 3,
  occupants: 2,
  pets: 1,
  idealParts: 8.1,
  email: "slavi@vhodarena.eu",
  phone: "+359 88 123 4567",
};

export const DUE_DATE: L = { bg: "15 Ноември", en: "15 November" };
export const NEXT_DUE: L = { bg: "15 Декември", en: "15 December" };
export const CURRENT_PERIOD: L = { bg: "Ноември 2026", en: "November 2026" };

export type ApartmentStatus = "paid" | "unpaid";

export type Apartment = {
  no: number;
  floor: number;
  owner: L;
  occupants: number;
  pets: number;
  idealParts: number;
  maintenance: number;
  repair: number;
  total: number;
  status: ApartmentStatus;
  overdueMonths: number;
  overdueAmount: number;
};

const RAW: Array<[number, number, L, number, number, number, number]> = [
  // no, floor, owner, occupants, pets, ideal parts %, months overdue
  [1, 1, { bg: "Георги Петров", en: "Georgi Petrov" }, 2, 0, 7.2, 0],
  [2, 1, { bg: "Мария Иванова", en: "Maria Ivanova" }, 1, 1, 8.4, 0],
  [3, 2, { bg: "Стефан Николов", en: "Stefan Nikolov" }, 3, 0, 7.85, 0],
  [4, 2, { bg: "Десислава Стоянова", en: "Desislava Stoyanova" }, 2, 1, 8.6, 0],
  [5, 3, { bg: "Слави Тодоров", en: "Slavi Todorov" }, 2, 1, 8.1, 1],
  [6, 3, { bg: "Нели Колева", en: "Neli Koleva" }, 4, 0, 8.65, 0],
  [7, 4, { bg: "Петър Димитров", en: "Petar Dimitrov" }, 1, 0, 7.9, 0],
  [8, 4, { bg: "Виктория Ангелова", en: "Viktoria Angelova" }, 3, 1, 8.7, 0],
  [9, 5, { bg: "Красимир Маринов", en: "Krasimir Marinov" }, 4, 0, 8.8, 2],
  [10, 5, { bg: "Елена Георгиева", en: "Elena Georgieva" }, 2, 0, 8.3, 0],
  [11, 6, { bg: "Борислав Христов", en: "Borislav Hristov" }, 2, 1, 7.59, 0],
  [12, 6, { bg: "Радка Василева", en: "Radka Vasileva" }, 3, 0, 9.91, 2],
];

export const INITIAL_APARTMENTS: Apartment[] = RAW.map(
  ([no, floor, owner, occupants, pets, idealParts, overdueMonths]) => {
    const fee = monthlyFee(occupants, pets, idealParts);
    return {
      no,
      floor,
      owner,
      occupants,
      pets,
      idealParts,
      ...fee,
      status: overdueMonths > 0 ? "unpaid" : "paid",
      overdueMonths,
      overdueAmount: Math.round(fee.total * overdueMonths * 100) / 100,
    };
  },
);

export type FundKey = "current" | "repair" | "roof";

export const FUND_META: Record<FundKey, { label: L; target?: number }> = {
  current: { label: { bg: "Текущи нужди", en: "Current needs" } },
  repair: { label: { bg: "Фонд Ремонт", en: "Repair Fund" } },
  roof: { label: { bg: "Целеви фонд Покрив", en: "Roof Target Fund" }, target: 5000 },
};

export const INITIAL_FUNDS: Record<FundKey, number> = {
  current: 420.5,
  repair: 2850,
  roof: 1200,
};

/** Q4 collection baseline for the entrance. */
export const COLLECTION_BASE = { collected: 1248, assessed: 1482 };

export type Contract = {
  id: string;
  service: L;
  provider: L;
  monthly: number;
  since: string;
  icon: "lift" | "cleaning" | "power";
};

const P = {
  lift: { bg: "Лифт Сервиз ООД", en: "Lift Servis Ltd" },
  clean: { bg: "Чисто Вход ЕООД", en: "Chisto Vhod EOOD" },
  power: { bg: "Електрохолд Продажби", en: "Electrohold Sales" },
  lock: { bg: "Ключар Експрес", en: "Locksmith Express" },
  led: { bg: "Светлина ЛЕД ЕООД", en: "Svetlina LED EOOD" },
  roof: { bg: "Покриви Стил ООД", en: "Pokrivi Stil Ltd" },
} satisfies Record<string, L>;

export const CONTRACTS: Contract[] = [
  { id: "c1", service: { bg: "Поддръжка на асансьор", en: "Lift maintenance" }, provider: P.lift, monthly: 85, since: "01.2025", icon: "lift" },
  { id: "c2", service: { bg: "Почистване на стълбище", en: "Staircase cleaning" }, provider: P.clean, monthly: 90, since: "03.2025", icon: "cleaning" },
  { id: "c3", service: { bg: "Електричество общи части", en: "Common areas electricity" }, provider: P.power, monthly: 45, since: "01.2024", icon: "power" },
];

export type Expense = {
  id: string;
  date: string;
  provider: Text;
  description: Text;
  category: "lift" | "cleaning" | "lighting" | "lock" | "roof" | "other";
  fund: FundKey;
  amount: number;
  invoice: string;
};

export const EXPENSE_CATEGORY_LABEL: Record<Expense["category"], L> = {
  lift: { bg: "Асансьор", en: "Lift" },
  cleaning: { bg: "Почистване", en: "Cleaning" },
  lighting: { bg: "Осветление", en: "Lighting" },
  lock: { bg: "Брава / врата", en: "Lock / door" },
  roof: { bg: "Покрив", en: "Roof" },
  other: { bg: "Други", en: "Other" },
};

const liftFee = (m: L): L => ({ bg: `Абонаментна поддръжка асансьор – ${m.bg}`, en: `Lift maintenance subscription – ${m.en}` });
const cleanFee = (m: L): L => ({ bg: `Почистване стълбище – ${m.bg}`, en: `Staircase cleaning – ${m.en}` });
const powerFee = (m: L): L => ({ bg: `Ел. енергия общи части – ${m.bg}`, en: `Common areas electricity – ${m.en}` });
const OCT = { bg: "октомври", en: "October" };
const NOV = { bg: "ноември", en: "November" };
const DEC = { bg: "декември", en: "December" };

export const INITIAL_EXPENSES: Expense[] = [
  { id: "e1", date: "05.10.2026", provider: P.lift, description: liftFee(OCT), category: "lift", fund: "current", amount: 85, invoice: "F-0002841.pdf" },
  { id: "e2", date: "05.10.2026", provider: P.clean, description: cleanFee(OCT), category: "cleaning", fund: "current", amount: 90, invoice: "F-0001173.pdf" },
  { id: "e3", date: "12.10.2026", provider: P.power, description: powerFee(OCT), category: "lighting", fund: "current", amount: 45, invoice: "F-7741029.pdf" },
  { id: "e4", date: "19.10.2026", provider: P.lock, description: { bg: "Ремонт брава входна врата + 12 чипа", en: "Front door lock repair + 12 key fobs" }, category: "lock", fund: "current", amount: 186.3, invoice: "Kasova-bel-4412.pdf" },
  { id: "e5", date: "05.11.2026", provider: P.lift, description: liftFee(NOV), category: "lift", fund: "current", amount: 85, invoice: "F-0002907.pdf" },
  { id: "e6", date: "05.11.2026", provider: P.clean, description: cleanFee(NOV), category: "cleaning", fund: "current", amount: 90, invoice: "F-0001198.pdf" },
  { id: "e7", date: "08.11.2026", provider: P.led, description: { bg: "Подмяна осветление LED + сензори (6 етажа)", en: "LED lighting + motion sensors (6 floors)" }, category: "lighting", fund: "repair", amount: 214, invoice: "F-0000562.pdf" },
  { id: "e8", date: "11.11.2026", provider: P.power, description: powerFee(NOV), category: "lighting", fund: "current", amount: 45, invoice: "F-7790144.pdf" },
  { id: "e9", date: "20.11.2026", provider: P.roof, description: { bg: "Частичен ремонт хидроизолация покрив", en: "Partial roof waterproofing repair" }, category: "roof", fund: "roof", amount: 860, invoice: "F-0003310.pdf" },
  { id: "e10", date: "05.12.2026", provider: P.lift, description: liftFee(DEC), category: "lift", fund: "current", amount: 85, invoice: "F-0002969.pdf" },
  { id: "e11", date: "05.12.2026", provider: P.clean, description: cleanFee(DEC), category: "cleaning", fund: "current", amount: 90, invoice: "F-0001224.pdf" },
  { id: "e12", date: "11.12.2026", provider: P.power, description: powerFee(DEC), category: "lighting", fund: "current", amount: 45, invoice: "F-7812337.pdf" },
];

export const Q4_INCOME = 4446;

export const CASHFLOW: Array<{ month: L; income: number; expenses: number }> = [
  { month: { bg: "Юни", en: "Jun" }, income: 1410, expenses: 580 },
  { month: { bg: "Юли", en: "Jul" }, income: 1455, expenses: 612 },
  { month: { bg: "Авг", en: "Aug" }, income: 1390, expenses: 1045 },
  { month: { bg: "Сеп", en: "Sep" }, income: 1482, expenses: 640 },
  { month: { bg: "Окт", en: "Oct" }, income: 1470, expenses: 406.3 },
  { month: { bg: "Ное", en: "Nov" }, income: 1248, expenses: 1294 },
];

export type ResidentPayment = {
  id: string;
  period: L;
  amount: number;
  date: string;
  method: "card" | "sepa" | "cash";
};

export const INITIAL_PAYMENTS: ResidentPayment[] = [
  { id: "p1", period: { bg: "Октомври 2026", en: "October 2026" }, amount: 38.5, date: "12.10.2026", method: "card" },
  { id: "p2", period: { bg: "Септември 2026", en: "September 2026" }, amount: 38.5, date: "09.09.2026", method: "sepa" },
  { id: "p3", period: { bg: "Август 2026", en: "August 2026" }, amount: 38.5, date: "14.08.2026", method: "card" },
  { id: "p4", period: { bg: "Юли 2026", en: "July 2026" }, amount: 38.5, date: "10.07.2026", method: "cash" },
];

export type TicketCategory = "lift" | "leak" | "light" | "lock";

export const TICKET_CATEGORIES: Record<TicketCategory, L> = {
  lift: { bg: "Асансьор", en: "Lift" },
  leak: { bg: "Теч", en: "Leak" },
  light: { bg: "Осветление", en: "Lighting" },
  lock: { bg: "Брава", en: "Lock" },
};

export type Ticket = {
  id: string;
  category: TicketCategory;
  description: Text;
  photo?: string | undefined;
  createdAt: string;
  status: "new" | "in_progress" | "done";
};

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: "T-1038",
    category: "light",
    description: { bg: "Не свети лампата на 4-ти етаж.", en: "The 4th floor light is out." },
    createdAt: "02.11.2026",
    status: "done",
  },
];

export const SUPERVISORS = [
  { id: "ivan", name: { bg: "Иван Георгиев", en: "Ivan Georgiev" }, role: { bg: "Председател на КС", en: "Board chair" }, initials: { bg: "ИГ", en: "IG" }, isYou: true },
  { id: "elena", name: { bg: "Елена Димитрова", en: "Elena Dimitrova" }, role: { bg: "Член на КС", en: "Board member" }, initials: { bg: "ЕД", en: "ED" }, isYou: false },
  { id: "petar", name: { bg: "Петър Димитров", en: "Petar Dimitrov" }, role: { bg: "Член на КС", en: "Board member" }, initials: { bg: "ПД", en: "PD" }, isYou: false },
] as const satisfies ReadonlyArray<{ id: SupervisorId; name: L; role: L; initials: L; isYou: boolean }>;

export type SupervisorId = "ivan" | "elena" | "petar";

/** A current expense the manager asks the board to approve. */
export type ExpenseRequest = {
  id: string;
  date: string; // DD.MM.YYYY
  description: Text;
  provider: Text;
  amount: number;
  votes: Partial<Record<SupervisorId, "approve" | "reject">>;
};

export const INITIAL_EXPENSE_REQUESTS: ExpenseRequest[] = [
  { id: "r1", date: "06.11.2026", description: { bg: "Подмяна на счупено стъкло, прозорец 3-ти етаж", en: "Replace broken window glass, 3rd floor" }, provider: { bg: "Стъкларски услуги ЕТ", en: "Glass Services" }, amount: 140, votes: {} },
  { id: "r2", date: "09.11.2026", description: { bg: "Ремонт на домофонна система", en: "Intercom system repair" }, provider: P.lock, amount: 265, votes: {} },
  { id: "r3", date: "10.11.2026", description: { bg: "Боядисване на стълбището (всички етажи)", en: "Repaint the staircase (all floors)" }, provider: { bg: "Бояджия Строй ООД", en: "Boyadzhiya Stroy Ltd" }, amount: 1250, votes: {} },
];
