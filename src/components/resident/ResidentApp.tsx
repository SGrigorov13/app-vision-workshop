import {
  ArrowUpDown,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Droplets,
  FileText,
  Hammer,
  Home,
  Info,
  KeyRound,
  Landmark,
  Lightbulb,
  Loader2,
  LogOut,
  MapPin,
  PieChart,
  Receipt,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PhoneFrame } from "./PhoneFrame";
import { PhoneSheet } from "./PhoneSheet";
import { SepaQr } from "./SepaQr";
import { LangToggle, ThemeModeSegmented } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLang, type L } from "@/lib/i18n";
import {
  BUILDING,
  CONTRACTS,
  CURRENT_PERIOD,
  CURRENT_USER,
  DUE_DATE,
  EXPENSE_CATEGORY_LABEL,
  FUND_META,
  NEXT_DUE,
  TICKET_CATEGORIES,
  type Contract,
  type FundKey,
  type Ticket,
  type TicketCategory,
} from "@/lib/mock-data";
import { useMockStore } from "@/lib/mock-store";
import { PALETTES, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Tab = "home" | "bills" | "reports" | "profile";
type Sheet = null | "card" | "sepa" | "ticket";

export function ResidentApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<Sheet>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <PhoneFrame>
      <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
        <div key={tab} className="animate-fade-up">
          {tab === "home" && <HomeScreen onOpen={setSheet} />}
          {tab === "bills" && <BillsScreen onOpen={setSheet} />}
          {tab === "reports" && <ReportsScreen />}
          {tab === "profile" && <ProfileScreen />}
        </div>
      </div>
      <BottomNav tab={tab} onChange={setTab} />

      <CardPaySheet open={sheet === "card"} onClose={() => setSheet(null)} />
      <SepaSheet open={sheet === "sepa"} onClose={() => setSheet(null)} />
      <TicketSheet open={sheet === "ticket"} onClose={() => setSheet(null)} />
    </PhoneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Header + navigation                                                 */
/* ------------------------------------------------------------------ */

function ResidentHeader() {
  const { l, pct } = useLang();
  return (
    <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{address}</span>
        </p>
        <h1 className="mt-1 text-xl font-bold">
          {l("Здравей", "Hi")}, {l(CURRENT_USER.firstName)} 👋
        </h1>
        <Badge variant="soft" className="mt-2">
          {l("Ап.", "Apt.")} {CURRENT_USER.apartment}, {l("Етаж", "Floor")} {CURRENT_USER.floor} • {pct(CURRENT_USER.idealParts)}{" "}
          {l("Идеални части", "Ideal parts")}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label={l("Известия", "Notifications")}
          onClick={() =>
            toast(l("Няма нови известия", "No new notifications"), {
              description: l("Всичко е наред във вашия вход.", "All good in your entrance."),
            })
          }
          className="relative grid size-10 place-items-center rounded-full bg-muted text-foreground"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" />
        </button>
        <span className="grid size-10 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
          {l(CURRENT_USER.initials)}
        </span>
      </div>
    </div>
  );
}

const NAV: Array<{ id: Tab; label: L; icon: LucideIcon }> = [
  { id: "home", label: { bg: "Начало", en: "Home" }, icon: Home },
  { id: "bills", label: { bg: "Сметки", en: "Bills" }, icon: Receipt },
  { id: "reports", label: { bg: "Отчети", en: "Reports" }, icon: PieChart },
  { id: "profile", label: { bg: "Профил", en: "Profile" }, icon: User },
];

function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { l } = useLang();
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-border bg-card px-2 pb-2 pt-2">
      {NAV.map((n) => {
        const active = tab === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onChange(n.id)}
            className="flex flex-col items-center gap-1 py-1"
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                "grid h-8 w-14 place-items-center rounded-full transition-all duration-300",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-5" />
            </span>
            <span className={cn("text-[11px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}>
              {l(n.label)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between px-5">
      <h2 className="text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                */
/* ------------------------------------------------------------------ */

function HomeScreen({ onOpen }: { onOpen: (s: Sheet) => void }) {
  const { l } = useLang();
  return (
    <>
      <ResidentHeader />
      <div className="px-5">
        <FeeCard onOpen={onOpen} />
      </div>

      <div className="mt-7">
        <SectionTitle
          action={
            <Badge variant="success">
              <span className="size-1.5 rounded-full bg-success" /> {l("На живо", "Live")}
            </Badge>
          }
        >
          {l("Фондове на входа", "Entrance funds")}
        </SectionTitle>
        <FundCarousel />
      </div>

      <div className="mt-7 px-5">
        <button
          onClick={() => onOpen("ticket")}
          className="group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left shadow-card transition-transform active:scale-[0.98]"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-warning/18 text-warning-foreground dark:text-warning">
            <TriangleAlert className="size-6" />
          </span>
          <span className="flex-1">
            <span className="block font-bold">{l("Подай сигнал за повреда", "Report a fault")}</span>
            <span className="block text-xs text-muted-foreground">
              {l("Асансьор, теч, осветление, брава", "Lift, leak, lighting, lock")}
            </span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
        <MyTickets />
      </div>

      <div className="mt-7">
        <SectionTitle>{l("Договори за услуги", "Service contracts")}</SectionTitle>
        <div className="space-y-2 px-5">
          {CONTRACTS.map((c) => (
            <ContractRow key={c.id} contract={c} />
          ))}
        </div>
      </div>
    </>
  );
}

function FeeCard({ onOpen }: { onOpen: (s: Sheet) => void }) {
  const { derived } = useMockStore();
  const { l, eur, pct } = useLang();
  const apt = derived.myApartment;
  const paid = apt.status === "paid";
  const maintenancePct = (apt.maintenance / apt.total) * 100;

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-brand p-5 text-primary-foreground shadow-glow">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary-foreground/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium opacity-80">
            {paid ? `${l(CURRENT_PERIOD)} • ${l("Платено", "Paid")}` : l("Дължимо за Ноември", "Due for November")}
          </p>
          {paid ? (
            <span className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-semibold">
              <CheckCircle2 className="size-3.5" /> {l("Платено", "Paid")}
            </span>
          ) : (
            <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-semibold">
              {l("Срок", "Due")}: {l(DUE_DATE)}
            </span>
          )}
        </div>

        <p className="tabular mt-2 text-[2.6rem] font-bold leading-none">{eur(paid ? 0 : apt.total)}</p>
        {paid && (
          <p className="mt-2 text-sm opacity-80">
            {l("Следваща вноска", "Next payment")}: {eur(apt.total)} {l("до", "by")} {l(NEXT_DUE)}
          </p>
        )}

        {!paid && (
          <>
            <div className="mt-5 space-y-2.5 text-sm">
              <BreakdownRow
                label={l("чл. 51 ЗУЕС", "Art. 51 ZUES")}
                hint={l(
                  `${CURRENT_USER.occupants} обитатели + ${CURRENT_USER.pets} домашен любимец`,
                  `${CURRENT_USER.occupants} occupants + ${CURRENT_USER.pets} pet`,
                )}
                amount={eur(apt.maintenance)}
                dotClass="bg-primary-foreground"
              />
              <BreakdownRow
                label={l("чл. 50 ЗУЕС", "Art. 50 ZUES")}
                hint={`${l("Фонд Ремонт и обновяване", "Repair & Renovation Fund")} ${pct(CURRENT_USER.idealParts)}`}
                amount={eur(apt.repair)}
                dotClass="bg-highlight"
              />
            </div>

            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-primary-foreground/15">
                <div className="h-full bg-primary-foreground transition-all" style={{ width: `${maintenancePct}%` }} />
                <div className="h-full flex-1 bg-highlight" />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-medium opacity-75">
                <span>
                  {l("Поддръжка", "Maintenance")} {Math.round(maintenancePct)}%
                </span>
                <span>
                  {l("Ремонт", "Repair")} {100 - Math.round(maintenancePct)}%
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="onBrand" size="lg" className="px-3" onClick={() => onOpen("card")}>
                <CreditCard /> {l("Плати с карта", "Pay by card")}
              </Button>
              <Button variant="onBrandGhost" size="lg" className="px-3" onClick={() => onOpen("sepa")}>
                <Landmark /> {l("SEPA / Банка", "SEPA / Bank")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BreakdownRow({ label, hint, amount, dotClass }: { label: string; hint: string; amount: string; dotClass: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex gap-2">
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotClass)} />
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs opacity-75">{hint}</p>
        </div>
      </div>
      <p className="tabular font-semibold">{amount}</p>
    </div>
  );
}

const FUND_ICON: Record<FundKey, LucideIcon> = { current: Wallet, repair: Hammer, roof: Home };

function FundCarousel() {
  const { state } = useMockStore();
  const { l, eur } = useLang();
  return (
    <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-1">
      {(Object.keys(FUND_META) as FundKey[]).map((k) => {
        const Icon = FUND_ICON[k];
        const meta = FUND_META[k];
        const value = state.funds[k];
        const pctValue = meta.target ? Math.min(100, (value / meta.target) * 100) : undefined;
        return (
          <div key={k} className="w-[158px] shrink-0 snap-start rounded-3xl border border-border bg-card p-4 shadow-card">
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-[18px]" />
            </span>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{l(meta.label)}</p>
            <p className="tabular mt-0.5 text-lg font-bold">{eur(value)}</p>
            {pctValue !== undefined && meta.target ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pctValue}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {Math.round(pctValue)}% {l("от цел", "of target")} {eur(meta.target, { decimals: 0 })}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-muted-foreground">{l("Обновено преди 2 мин.", "Updated 2 min ago")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const CONTRACT_ICON: Record<Contract["icon"], LucideIcon> = { lift: ArrowUpDown, cleaning: Sparkles, power: Zap };

function ContractRow({ contract }: { contract: Contract }) {
  const { l, eur } = useLang();
  const Icon = CONTRACT_ICON[contract.icon];
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-foreground shadow-card">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{l(contract.service)}</p>
        <p className="truncate text-xs text-muted-foreground">{l(contract.provider)}</p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-bold">
          {eur(contract.monthly, { decimals: 0 })}/{l("мес.", "mo")}
        </p>
        <button
          onClick={() =>
            toast.success(l("Договорът се изтегля", "Downloading contract"), {
              description: `Dogovor-${contract.id.toUpperCase()}-${contract.since}.pdf`,
            })
          }
          className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-bold text-destructive"
        >
          <Download className="size-3" /> PDF
        </button>
      </div>
    </div>
  );
}

const TICKET_STATUS: Record<Ticket["status"], { label: L; variant: "warning" | "soft" | "success" }> = {
  new: { label: { bg: "Приет", en: "Received" }, variant: "warning" },
  in_progress: { label: { bg: "В процес", en: "In progress" }, variant: "soft" },
  done: { label: { bg: "Отстранен", en: "Fixed" }, variant: "success" },
};

function MyTickets() {
  const { state } = useMockStore();
  const { l } = useLang();
  if (!state.tickets.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {state.tickets.slice(0, 3).map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 animate-fade-up">
          <span className="tabular text-[11px] font-bold text-muted-foreground">{t.id}</span>
          <p className="min-w-0 flex-1 truncate text-xs">
            <span className="font-semibold">{l(TICKET_CATEGORIES[t.category])}</span> · {l(t.description)}
          </p>
          <Badge variant={TICKET_STATUS[t.status].variant}>{l(TICKET_STATUS[t.status].label)}</Badge>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bills                                                               */
/* ------------------------------------------------------------------ */

const METHOD_LABEL: Record<"card" | "sepa" | "cash", L> = {
  card: { bg: "Карта", en: "Card" },
  sepa: { bg: "SEPA превод", en: "SEPA transfer" },
  cash: { bg: "В брой", en: "Cash" },
};

function BillsScreen({ onOpen }: { onOpen: (s: Sheet) => void }) {
  const { state, derived } = useMockStore();
  const { l, eur } = useLang();
  const apt = derived.myApartment;
  const yearTotal = state.payments.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="px-5 pt-4">
      <h1 className="text-2xl font-bold">{l("Сметки", "Bills")}</h1>
      <p className="text-sm text-muted-foreground">
        {l("Ап.", "Apt.")} {CURRENT_USER.apartment} • {l(BUILDING.address)}
      </p>

      <div className="mt-5 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{l(CURRENT_PERIOD)}</p>
          {apt.status === "paid" ? (
            <Badge variant="success">
              <Check /> {l("Платено", "Paid")}
            </Badge>
          ) : (
            <Badge variant="warning">{l("Неплатено", "Unpaid")}</Badge>
          )}
        </div>
        <p className="tabular mt-2 text-3xl font-bold">{eur(apt.total)}</p>
        <p className="text-xs text-muted-foreground">
          {l("Срок", "Due")}: {l(DUE_DATE)} 2026
        </p>
        {apt.status === "unpaid" && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => onOpen("card")}>
              <CreditCard /> {l("Карта", "Card")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpen("sepa")}>
              <Landmark /> SEPA
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-muted/60 p-4">
          <p className="text-xs text-muted-foreground">{l("Платено 2026", "Paid in 2026")}</p>
          <p className="tabular mt-1 text-lg font-bold">{eur(yearTotal)}</p>
        </div>
        <div className="rounded-3xl bg-muted/60 p-4">
          <p className="text-xs text-muted-foreground">{l("Във Фонд Ремонт", "To Repair Fund")}</p>
          <p className="tabular mt-1 text-lg font-bold">{eur(apt.repair * state.payments.length)}</p>
        </div>
      </div>

      <h2 className="mb-3 mt-7 text-base font-bold">{l("История на плащанията", "Payment history")}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {state.payments.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3.5 animate-fade-up">
            <span className="grid size-10 place-items-center rounded-full bg-success/14 text-success">
              <Check className="size-[18px]" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{l(p.period)}</p>
              <p className="text-xs text-muted-foreground">
                {p.date} • {l(METHOD_LABEL[p.method])}
              </p>
            </div>
            <p className="tabular text-sm font-bold">{eur(p.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

function ReportsScreen() {
  const { state, derived } = useMockStore();
  const { l, eur } = useLang();
  const byCat = Object.entries(
    state.expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...byCat.map(([, v]) => v));
  const status = derived.reportStatus;

  return (
    <div className="px-5 pt-4">
      <h1 className="text-2xl font-bold">{l("Отчети", "Reports")}</h1>
      <p className="text-sm text-muted-foreground">{l("Пълна прозрачност по ЗУЕС", "Full transparency under ZUES")}</p>

      <div className="mt-5 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">{l("Отчет Q4-2026", "Q4-2026 report")}</p>
          {status === "APPROVED" ? (
            <Badge variant="success">
              <ShieldCheck /> {l("Одобрен", "Approved")}
            </Badge>
          ) : status === "REJECTED" ? (
            <Badge variant="destructive">{l("За корекция", "Needs correction")}</Badge>
          ) : (
            <Badge variant="warning">{l("Проверява се от КС", "Under board review")}</Badge>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label={l("Приходи", "Income")} value={eur(derived.income, { decimals: 0 })} />
          <Stat label={l("Разходи", "Expenses")} value={eur(derived.expensesTotal, { decimals: 0 })} />
          <Stat label={l("Баланс", "Balance")} value={eur(derived.net, { sign: true, decimals: 0 })} accent />
        </div>
        <div className="mt-5 space-y-3">
          {byCat.map(([cat, v]) => (
            <div key={cat}>
              <div className="flex justify-between text-xs">
                <span className="font-medium">{l(EXPENSE_CATEGORY_LABEL[cat as keyof typeof EXPENSE_CATEGORY_LABEL])}</span>
                <span className="tabular font-semibold">{eur(v)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-3 mt-7 text-base font-bold">{l("Архив", "Archive")}</h2>
      {["Q3-2026", "Q2-2026", "Q1-2026"].map((q) => (
        <button
          key={q}
          onClick={() =>
            toast.success(l(`Отчет ${q} се изтегля`, `Downloading ${q} report`), {
              description: `Otchet-${q}.pdf • ${l("подписан от КС", "signed by the board")}`,
            })
          }
          className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-card shadow-card">
            <FileText className="size-[18px]" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">{l(`Отчет ${q}`, `${q} report`)}</span>
            <span className="block text-xs text-muted-foreground">
              {l("Одобрен • 100% консенсус", "Approved • 100% consensus")}
            </span>
          </span>
          <Download className="size-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-1 py-2.5">
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("tabular text-sm font-bold", accent && "text-success")}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function ProfileScreen() {
  const { mode, setMode, palette, setPalette } = useTheme();
  const { l, pct } = useLang();
  return (
    <div className="px-5 pt-4">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-20 place-items-center rounded-full bg-gradient-brand text-2xl font-bold text-primary-foreground shadow-glow">
          {l(CURRENT_USER.initials)}
        </span>
        <h1 className="mt-3 text-xl font-bold">{l(CURRENT_USER.name)}</h1>
        <p className="text-sm text-muted-foreground">{CURRENT_USER.email}</p>
        <Badge variant="soft" className="mt-2">
          {l("Собственик", "Owner")}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <InfoTile label={l("Апартамент", "Apartment")} value={String(CURRENT_USER.apartment)} />
        <InfoTile label={l("Етаж", "Floor")} value={String(CURRENT_USER.floor)} />
        <InfoTile label={l("Ид. части", "Ideal parts")} value={pct(CURRENT_USER.idealParts)} />
        <InfoTile label={l("Обитатели", "Occupants")} value={String(CURRENT_USER.occupants)} />
        <InfoTile label={l("Любимци", "Pets")} value={String(CURRENT_USER.pets)} />
        <InfoTile label={l("Вход", "Entrance")} value="А" />
      </div>

      <h2 className="mb-2 mt-7 text-sm font-bold">{l("Език", "Language")}</h2>
      <LangToggle className="w-fit p-1 [&>button]:px-5 [&>button]:py-2 [&>button]:text-sm" />

      <h2 className="mb-2 mt-5 text-sm font-bold">{l("Тема", "Theme")}</h2>
      <ThemeModeSegmented mode={mode} onChange={setMode} />

      <h2 className="mb-2 mt-5 text-sm font-bold">{l("Цветова гама", "Colour palette")}</h2>
      <div className="flex gap-2">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPalette(p.id)}
            aria-label={l(p.name)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border-2 transition-all",
              palette === p.id ? "scale-105 border-primary" : "border-transparent",
            )}
          >
            <span
              className="size-8 rounded-full"
              // Swatch preview of another palette — intentionally independent of the active theme.
              style={{ background: `linear-gradient(135deg, ${p.swatch[1]}, ${p.swatch[2]})` }}
            />
          </button>
        ))}
      </div>

      <h2 className="mb-2 mt-7 text-sm font-bold">{l("Известия", "Notifications")}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        <ToggleRow label={l("Push напомняния за такси", "Push reminders for fees")} defaultChecked />
        <ToggleRow label={l("Имейл при нов отчет", "Email on new report")} defaultChecked />
        <ToggleRow label={l("Статус на сигналите", "Fault report status")} defaultChecked />
        <ToggleRow label={l("Новини от входа", "Entrance news")} defaultChecked={false} />
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-accent/60 p-3 text-xs text-accent-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {l(
          "Всички суми в VhodArena са в евро (€) съгласно Закона за управление на етажната собственост.",
          "All amounts in VhodArena are in euro (€) under the Bulgarian Condominium Management Act (ZUES).",
        )}
      </div>

      <Button
        variant="ghost"
        className="mt-4 w-full text-destructive"
        onClick={() => toast(l("Това е демо — изходът е изключен", "This is a demo — sign out is disabled"))}
      >
        <LogOut /> {l("Изход", "Sign out")}
      </Button>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3 text-center">
      <p className="tabular text-base font-bold">{value}</p>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
      {label}
      <Switch defaultChecked={defaultChecked} />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Sheets                                                              */
/* ------------------------------------------------------------------ */

function CardPaySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { derived, payApartment } = useMockStore();
  const { l, eur } = useLang();
  const [phase, setPhase] = useState<"review" | "processing" | "success">("review");
  const [paidAmount, setPaidAmount] = useState(0);
  const amount = derived.myApartment.total;

  useEffect(() => {
    if (open) setPhase("review");
  }, [open]);

  const pay = () => {
    setPhase("processing");
    setPaidAmount(amount);
    setTimeout(() => {
      payApartment(CURRENT_USER.apartment, "card");
      setPhase("success");
      toast.success(l("Плащането е успешно", "Payment successful"), {
        description: `${eur(amount)} • ${l(CURRENT_PERIOD)}`,
      });
    }, 1600);
  };

  return (
    <PhoneSheet
      open={open}
      onClose={phase === "processing" ? () => {} : onClose}
      title={phase === "success" ? "" : l("Плащане с карта", "Card payment")}
    >
      {phase === "success" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-success text-success-foreground animate-pop">
            <Check className="size-10" strokeWidth={3} />
          </span>
          <h3 className="mt-5 text-xl font-bold">{l("Платено!", "Paid!")}</h3>
          <p className="tabular mt-1 text-3xl font-bold">{eur(paidAmount)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {l("Разписка", "Receipt")} № VA-{CURRENT_USER.apartment}-11-2026 {l("е изпратена на", "was sent to")}{" "}
            {CURRENT_USER.email}
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={onClose}>
            {l("Готово", "Done")}
          </Button>
        </div>
      ) : (
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-4 text-primary-foreground">
            <div className="flex justify-between text-xs font-semibold opacity-80">
              <span>VhodArena Pay</span>
              <span>VISA</span>
            </div>
            <p className="tabular mt-6 text-lg tracking-[0.2em]">•••• •••• •••• 4821</p>
            <div className="mt-3 flex justify-between text-xs opacity-80">
              <span>{CURRENT_USER.name.en.toUpperCase()}</span>
              <span>09/29</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-2xl bg-muted/60 p-3 text-sm">
            <Row label={l("Такса поддръжка (чл. 51)", "Maintenance fee (Art. 51)")} value={eur(derived.myApartment.maintenance)} />
            <Row label={l("Фонд Ремонт (чл. 50)", "Repair Fund (Art. 50)")} value={eur(derived.myApartment.repair)} />
            <Row label={l("Такса обработка", "Processing fee")} value={eur(0)} />
            <div className="border-t border-border pt-2">
              <Row label={l("Общо", "Total")} value={eur(amount)} bold />
            </div>
          </div>
          <Button size="lg" className="mt-5 w-full" onClick={pay} disabled={phase === "processing"}>
            {phase === "processing" ? (
              <>
                <Loader2 className="animate-spin" /> {l("Обработка…", "Processing…")}
              </>
            ) : (
              <>
                {l("Плати", "Pay")} {eur(amount)}
              </>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" /> {l("3-D Secure • PSD2 защитено плащане", "3-D Secure • PSD2 protected payment")}
          </p>
        </div>
      )}
    </PhoneSheet>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "font-bold")}>
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}

function SepaSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { derived, payApartment } = useMockStore();
  const { l, eur } = useLang();
  const amount = derived.myApartment.total;
  const reference = `VHOD-A58-AP${CURRENT_USER.apartment}-11/2026`;
  const payload = `BCD\n002\n1\nSCT\nBNBGBGSD\n${BUILDING.beneficiary.en}\n${BUILDING.iban}\nEUR${amount.toFixed(2)}\n\n${reference}`;

  const copy = (value: string, label: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    toast.success(l(`${label} е копиран`, `${label} copied`));
  };

  const markSent = () => {
    onClose();
    toast(l("Очакваме превода", "Waiting for your transfer"), {
      description: l("Ще отразим плащането автоматично при получаване.", "We'll record the payment automatically once it arrives."),
    });
    setTimeout(() => {
      payApartment(CURRENT_USER.apartment, "sepa");
      toast.success(l("SEPA преводът е получен", "SEPA transfer received"), { description: `${eur(amount)} • ${reference}` });
    }, 2800);
  };

  return (
    <PhoneSheet open={open} onClose={onClose} title={l("SEPA превод в евро", "SEPA transfer in euro")}>
      <div className="flex flex-col items-center">
        <div className="rounded-3xl bg-qr p-3 shadow-card">
          <SepaQr payload={payload} size={190} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {l("Сканирайте с банковото си приложение (EPC QR)", "Scan with your banking app (EPC QR)")}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <CopyField label={l("Получател", "Beneficiary")} value={l(BUILDING.beneficiary)} />
        <CopyField label="IBAN" value={BUILDING.iban} mono onCopy={() => copy(BUILDING.iban, "IBAN")} />
        <CopyField label={l("Сума", "Amount")} value={eur(amount)} />
        <CopyField
          label={l("Основание", "Reference")}
          value={reference}
          mono
          onCopy={() => copy(reference, l("Основанието", "Reference"))}
        />
      </div>
      <Button size="lg" className="mt-5 w-full" onClick={markSent}>
        {l("Изпратих превода", "I've sent the transfer")}
      </Button>
    </PhoneSheet>
  );
}

function CopyField({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) {
  const { l } = useLang();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-semibold", mono && "tabular")}>{value}</p>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          aria-label={`${l("Копирай", "Copy")} ${label}`}
          className="grid size-8 place-items-center rounded-full bg-card text-foreground shadow-card"
        >
          <Copy className="size-3.5" />
        </button>
      )}
    </div>
  );
}

const TICKET_ICONS: Record<TicketCategory, LucideIcon> = {
  lift: ArrowUpDown,
  leak: Droplets,
  light: Lightbulb,
  lock: KeyRound,
};

function TicketSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTicket } = useMockStore();
  const { l } = useLang();
  const [category, setCategory] = useState<TicketCategory | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setCategory(null);
      setDescription("");
      setPhoto(null);
      setSending(false);
    }
  }, [open]);

  const valid = category !== null && description.trim().length >= 5;

  const submit = () => {
    if (!valid || !category) return;
    setSending(true);
    setTimeout(() => {
      const id = addTicket({ category, description: description.trim(), photo: photo ?? undefined });
      toast.success(l(`Сигнал ${id} е изпратен`, `Report ${id} sent`), {
        description: l("Домоуправителят е уведомен с push известие.", "The manager was notified by push."),
      });
      onClose();
    }, 900);
  };

  return (
    <PhoneSheet open={open} onClose={onClose} title={l("Сигнал за повреда", "Fault report")}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l("Категория", "Category")}</p>
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(TICKET_CATEGORIES) as TicketCategory[]).map((c) => {
          const Icon = TICKET_ICONS[c];
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-[11px] font-semibold transition-all",
                active ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card text-foreground",
              )}
            >
              <Icon className="size-5" />
              {l(TICKET_CATEGORIES[c])}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l("Снимка", "Photo")}</p>
      <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-primary">
        {photo ? (
          <img src={photo} alt={l("Прикачена снимка", "Attached photo")} className="h-full w-full object-cover" />
        ) : (
          <>
            <Camera className="size-6" />
            {l("Снимай или избери от галерията", "Take a photo or choose from gallery")}
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPhoto(URL.createObjectURL(f));
          }}
        />
      </label>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l("Описание", "Description")}</p>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={l("Напр. асансьорът спира между 3-ти и 4-ти етаж…", "E.g. the lift stops between the 3rd and 4th floor…")}
        className="min-h-24 rounded-2xl"
      />

      <Button size="lg" className="mt-5 w-full" disabled={!valid || sending} onClick={submit}>
        {sending ? (
          <>
            <Loader2 className="animate-spin" /> {l("Изпращане…", "Sending…")}
          </>
        ) : (
          l("Изпрати сигнал", "Send report")
        )}
      </Button>
    </PhoneSheet>
  );
}
