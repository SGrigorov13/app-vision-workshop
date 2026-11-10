import { useLang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpRight,
  BellRing,
  Banknote,
  Check,
  CheckCircle2,
  FileBarChart,
  Landmark,
  Loader2,
  Mail,
  PiggyBank,
  Plus,
  Smartphone,
  Upload,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatEUR, formatPercent } from "@/lib/format";
import {
  BUILDING,
  CASHFLOW,
  CURRENT_PERIOD,
  EXPENSE_CATEGORY_LABEL,
  FUND_META,
  type Expense,
  type FundKey,
} from "@/lib/mock-data";
import { useMockStore } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

export function ManagerDashboard() {
  const { l } = useLang();
  const [dialog, setDialog] = useState<null | "dunning" | "expense" | "report">(null);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="animate-fade-up">
          <p className="text-sm font-medium text-muted-foreground">{address} • {l(CURRENT_PERIOD)}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Табло на Домоуправителя</h1>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" onClick={() => setDialog("dunning")}>
            <BellRing /> Пусни Dunning напомняния
          </Button>
          <Button variant="soft" onClick={() => setDialog("expense")}>
            <Plus /> Въведи разход
          </Button>
          <Button onClick={() => setDialog("report")}>
            <FileBarChart /> Генерирай тримесечен отчет
          </Button>
        </div>
      </div>

      <Metrics />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <CashflowCard />
        <ExpenseDonutCard />
      </div>

      <Ledger />

      <RecentExpenses />

      <DunningDialog open={dialog === "dunning"} onOpenChange={(o) => setDialog(o ? "dunning" : null)} />
      <ExpenseDialog open={dialog === "expense"} onOpenChange={(o) => setDialog(o ? "expense" : null)} />
      <ReportDialog open={dialog === "report"} onOpenChange={(o) => setDialog(o ? "report" : null)} />
    </div>
  );
}

/* ---------------- Metrics ---------------- */

function Metrics() {
  const { state, derived } = useMockStore();
  const items = [
    {
      label: "Събираемост",
      value: formatPercent(derived.collectionRate, 1),
      sub: `${formatEUR(state.collected, { decimals: 0 })} / ${formatEUR(derived.assessed, { decimals: 0 })} събрани`,
      icon: CheckCircle2,
      tone: "bg-success/14 text-success",
      progress: derived.collectionRate,
    },
    {
      label: "Просрочени апартаменти",
      value: `${derived.overdueUnits} ${derived.overdueUnits === 1 ? "апартамент" : "апартамента"}`,
      sub: `${formatEUR(derived.overdueTotal)} общо просрочие`,
      icon: AlertCircle,
      tone: "bg-destructive/12 text-destructive",
    },
    {
      label: "Наличност в каса",
      value: formatEUR(state.funds.current),
      sub: "Текущи нужди",
      icon: Wallet,
      tone: "bg-accent text-accent-foreground",
    },
    {
      label: "Банков резерв",
      value: formatEUR(state.funds.repair),
      sub: "Фонд Ремонт",
      icon: PiggyBank,
      tone: "bg-highlight/20 text-foreground",
    },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {items.map((m, i) => (
        <div
          key={m.label}
          className="rounded-3xl border border-border bg-card p-4 shadow-card animate-fade-up lg:p-5"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground sm:text-sm">{m.label}</p>
            <span className={cn("grid size-8 place-items-center rounded-xl", m.tone)}>
              <m.icon className="size-4" />
            </span>
          </div>
          <p className="tabular mt-3 text-xl font-bold sm:text-2xl">{m.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.sub}</p>
          {m.progress !== undefined && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${m.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Charts ---------------- */

const cashflowConfig = {
  income: { label: "Приходи", color: "var(--chart-1)" },
  expenses: { label: "Разходи", color: "var(--chart-2)" },
} satisfies ChartConfig;

function CashflowCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">Паричен поток</h2>
          <p className="text-xs text-muted-foreground">Приходи срещу разходи • последните 6 месеца (EUR)</p>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-chart-1" /> Приходи</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-chart-2" /> Разходи</span>
        </div>
      </div>
      <ChartContainer config={cashflowConfig} className="mt-4 aspect-auto h-[260px] w-full">
        <BarChart data={CASHFLOW} barGap={4}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${v} €`} />
          <ChartTooltip
            cursor={{ radius: 12 }}
            content={<ChartTooltipContent formatter={(v, name) => (
              <div className="flex w-full justify-between gap-4">
                <span className="text-muted-foreground">{cashflowConfig[name as keyof typeof cashflowConfig]?.label}</span>
                <span className="tabular font-semibold">{formatEUR(Number(v))}</span>
              </div>
            )} />}
          />
          <Bar dataKey="income" fill="var(--color-income)" radius={[8, 8, 4, 4]} maxBarSize={28} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 4, 4]} maxBarSize={28} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ExpenseDonutCard() {
  const { l } = useLang();
  const { state, derived } = useMockStore();
  const data = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of state.expenses) acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return Object.entries(acc)
      .map(([k, v]) => ({ key: k, name: EXPENSE_CATEGORY_LABEL[k as Expense["category"]], value: Math.round(v * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [state.expenses]);

  const config = Object.fromEntries(data.map((d, i) => [d.key, { label: l(d.name), color: DONUT_COLORS[i % 5] }])) as ChartConfig;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-base font-bold">Структура на разходите</h2>
      <p className="text-xs text-muted-foreground">Q4-2026</p>
      <div className="relative">
        <ChartContainer config={config} className="mx-auto aspect-square h-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v, n) => (
              <div className="flex w-full justify-between gap-4">
                <span className="text-muted-foreground">{n}</span>
                <span className="tabular font-semibold">{formatEUR(Number(v))}</span>
              </div>
            )} />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={3} cornerRadius={6} strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={d.key} fill={DONUT_COLORS[i % 5]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Общо</span>
          <span className="tabular text-lg font-bold">{formatEUR(derived.expensesTotal, { decimals: 0 })}</span>
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % 5] }} />
            <span className="flex-1 font-medium">{l(d.name)}</span>
            <span className="tabular font-semibold">{formatEUR(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Ledger ---------------- */

function Ledger() {
  const { l } = useLang();
  const { state, payApartment } = useMockStore();
  const markCash = (no: number, amount: number) => {
    payApartment(no, "cash");
    toast.success(`Ап. ${no}: касово плащане отразено`, { description: `${formatEUR(amount)} • издадена касова бележка` });
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <div>
          <h2 className="text-base font-bold">Книга на задълженията</h2>
          <p className="text-xs text-muted-foreground">12 самостоятелни обекта • месечни такси по ЗУЕС</p>
        </div>
        <Badge variant="secondary">чл. 50 + чл. 51 ЗУЕС</Badge>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-2.5">Ап.</th>
              <th className="px-3 py-2.5">Етаж</th>
              <th className="px-3 py-2.5">Собственик</th>
              <th className="px-3 py-2.5 text-center">Живущи</th>
              <th className="px-3 py-2.5 text-right">Ид. части</th>
              <th className="px-3 py-2.5 text-right">Поддръжка</th>
              <th className="px-3 py-2.5 text-right">Ремонт</th>
              <th className="px-3 py-2.5 text-right">Общо</th>
              <th className="px-3 py-2.5">Статус</th>
              <th className="px-5 py-2.5 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {state.apartments.map((a) => (
              <tr key={a.no} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                <td className="tabular px-5 py-3 font-bold">{a.no}</td>
                <td className="tabular px-3 py-3">{a.floor}</td>
                <td className="px-3 py-3 font-medium">{l(a.owner)}</td>
                <td className="tabular px-3 py-3 text-center">
                  {a.occupants}
                  {a.pets > 0 && <span className="text-muted-foreground"> +{a.pets}🐾</span>}
                </td>
                <td className="tabular px-3 py-3 text-right">{formatPercent(a.idealParts)}</td>
                <td className="tabular px-3 py-3 text-right">{formatEUR(a.maintenance)}</td>
                <td className="tabular px-3 py-3 text-right">{formatEUR(a.repair)}</td>
                <td className="tabular px-3 py-3 text-right font-bold">{formatEUR(a.total)}</td>
                <td className="px-3 py-3">
                  <StatusBadge paid={a.status === "paid"} months={a.overdueMonths} />
                </td>
                <td className="px-5 py-3 text-right">
                  {a.status === "unpaid" ? (
                    <Button size="sm" variant="soft" onClick={() => markCash(a.no, a.overdueAmount)}>
                      <Banknote /> Маркирай касово плащане
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 px-3 pb-3 md:hidden">
        {state.apartments.map((a) => (
          <div key={a.no} className="rounded-2xl bg-muted/50 p-3">
            <div className="flex items-center gap-3">
              <span className="tabular grid size-10 place-items-center rounded-xl bg-card font-bold shadow-card">{a.no}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{l(a.owner)}</p>
                <p className="text-xs text-muted-foreground">
                  Ет. {a.floor} • {a.occupants} живущи{a.pets ? ` + ${a.pets}🐾` : ""} • {formatPercent(a.idealParts)}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-bold">{formatEUR(a.total)}</p>
                <StatusBadge paid={a.status === "paid"} months={a.overdueMonths} />
              </div>
            </div>
            {a.status === "unpaid" && (
              <Button size="sm" variant="soft" className="mt-3 w-full" onClick={() => markCash(a.no, a.overdueAmount)}>
                <Banknote /> Маркирай касово плащане • {formatEUR(a.overdueAmount)}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ paid, months }: { paid: boolean; months: number }) {
  return paid ? (
    <Badge variant="success"><Check /> Платено</Badge>
  ) : (
    <Badge variant="destructive">Неплатено{months > 1 ? ` • ${months} мес.` : ""}</Badge>
  );
}

/* ---------------- Recent expenses ---------------- */

function RecentExpenses() {
  const { l } = useLang();
  const { state } = useMockStore();
  const list = [...state.expenses].reverse().slice(0, 5);
  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Последни разходи</h2>
        <Link to="/kontrolen-savet" className="flex items-center gap-1 text-xs font-semibold text-primary">
          Всички в отчета <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {list.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-3 animate-fade-up">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">
              {l(EXPENSE_CATEGORY_LABEL[e.category]).slice(0, 2)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l(e.description)}</p>
              <p className="truncate text-xs text-muted-foreground">{l(e.provider)} • {e.date} • {l(FUND_META[e.fund].label)}</p>
            </div>
            <p className="tabular text-sm font-bold">−{formatEUR(e.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Dunning ---------------- */

type DunningEntry = { id: string; apt: number; owner: string; day: number; channel: "push" | "email"; amount: number };

function DunningDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { l } = useLang();
  const { state } = useMockStore();
  const [auto, setAuto] = useState(true);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<DunningEntry[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const overdue = state.apartments.filter((a) => a.status === "unpaid");

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const run = () => {
    if (!overdue.length) {
      toast.success("Няма просрочени апартаменти 🎉");
      return;
    }
    const queue: DunningEntry[] = [];
    for (const day of [0, 3, 6])
      for (const a of overdue)
        for (const channel of ["push", "email"] as const)
          queue.push({ id: `${day}-${a.no}-${channel}`, apt: a.no, owner: l(a.owner), day, channel, amount: a.overdueAmount });
    setLog([]);
    setRunning(true);
    let i = 0;
    timer.current = setInterval(() => {
      const next = queue[i];
      i++;
      if (next) setLog((l) => [...l, next]);
      if (i >= queue.length) {
        clearInterval(timer.current!);
        setRunning(false);
        toast.success(`Изпратени ${queue.length} напомняния`, { description: `${overdue.length} апартамента • цикъл на всеки 3 дни` });
      }
    }, 260);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Dunning напомняния</DialogTitle>
          <DialogDescription>Автоматични push и имейл напомняния на всеки 3 дни за просрочени такси.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3">
          <div>
            <p className="text-sm font-semibold">Автоматичен режим</p>
            <p className="text-xs text-muted-foreground">{auto ? "Активен • следващ цикъл след 3 дни" : "Изключен"}</p>
          </div>
          <Switch checked={auto} onCheckedChange={setAuto} />
        </div>

        <div className="flex flex-wrap gap-2">
          {overdue.map((a) => (
            <Badge key={a.no} variant="destructive">Ап. {a.no} • {formatEUR(a.overdueAmount)}</Badge>
          ))}
          {!overdue.length && <Badge variant="success">Всички са платили</Badge>}
        </div>

        <div className="no-scrollbar h-56 space-y-1.5 overflow-y-auto rounded-2xl border border-border bg-background p-2">
          {!log.length && (
            <p className="grid h-full place-items-center text-center text-xs text-muted-foreground">
              Натиснете „Стартирай симулация“, за да видите цикъла на напомнянията.
            </p>
          )}
          {log.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-xl bg-card px-2.5 py-2 text-xs animate-fade-up">
              <Badge variant="secondary" className="tabular">Ден {e.day}</Badge>
              {e.channel === "push" ? <Smartphone className="size-3.5 text-primary" /> : <Mail className="size-3.5 text-primary" />}
              <span className="flex-1 truncate">
                <b>Ап. {e.apt}</b> · {e.owner} — {e.channel === "push" ? "Push известие" : "Имейл"}
              </span>
              <span className="tabular font-semibold">{formatEUR(e.amount)}</span>
              <Check className="size-3.5 text-success" />
            </div>
          ))}
        </div>

        <Button size="lg" onClick={run} disabled={running}>
          {running ? <><Loader2 className="animate-spin" /> Изпращане…</> : <><BellRing /> Стартирай симулация</>}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Expense ---------------- */

function ExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { l } = useLang();
  const { addExpense } = useMockStore();
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState<FundKey>("current");
  const [category, setCategory] = useState<Expense["category"]>("other");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setProvider(""); setAmount(""); setFund("current"); setCategory("other"); setDescription(""); setFile(null);
    }
  }, [open]);

  const value = Number(amount.replace(",", "."));
  const valid = provider.trim().length > 1 && value > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    addExpense({
      provider: provider.trim(),
      amount: Math.round(value * 100) / 100,
      fund,
      category,
      description: description.trim() || `${EXPENSE_CATEGORY_LABEL[category]} – ${provider.trim()}`,
      date,
      invoice: file?.name ?? "bez-faktura.pdf",
    });
    toast.success("Разходът е записан", { description: `${formatEUR(value)} от „${FUND_META[fund].label}“` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Въведи разход</DialogTitle>
          <DialogDescription>Прикачете фактура или касова бележка. Сумата е в евро.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 text-xs text-muted-foreground transition-colors hover:border-primary">
            {file ? (
              file.url ? (
                <img src={file.url} alt="Фактура" className="h-full w-full object-cover" />
              ) : (
                <span className="font-semibold text-foreground">{file.name}</span>
              )
            ) : (
              <>
                <Upload className="size-6" /> Снимка на фактура / касова бележка
              </>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile({ name: f.name, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : "" });
              }}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="provider">Доставчик</Label>
              <Input id="provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Напр. Лифт Сервиз ООД" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Сума (EUR)</Label>
              <div className="relative">
                <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="pr-8 tabular" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€</span>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Фонд</Label>
              <Select value={fund} onValueChange={(v) => setFund(v as FundKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(FUND_META) as FundKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{l(FUND_META[k].label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Категория</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Expense["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPENSE_CATEGORY_LABEL) as Expense["category"][]).map((k) => (
                    <SelectItem key={k} value={k}>{l(EXPENSE_CATEGORY_LABEL[k])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="desc">Описание</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Напр. Смяна на крушки 2-ри етаж" />
          </div>
          <Button type="submit" size="lg" disabled={!valid}>
            <Check /> Запиши разхода
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Quarterly report ---------------- */

const REPORT_STEPS = [
  "Събиране на приходи и разходи за Q4-2026",
  "Прикачване на фактури и касови бележки",
  "Изчисляване на салда по фондове",
  "Подписване с SHA-256 отпечатък",
  "Изпращане до Контролния съвет",
];

function ReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, derived, sendReport } = useMockStore();
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!open) { setStep(-1); return; }
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= REPORT_STEPS.length - 1) {
          clearInterval(id);
          return REPORT_STEPS.length;
        }
        return s + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (step === REPORT_STEPS.length) {
      sendReport();
      toast.success("Отчетът Q4-2026 е изпратен", { description: "Контролният съвет е уведомен за верификация." });
    }
  }, [step, sendReport]);

  const done = step >= REPORT_STEPS.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Тримесечен отчет Q4-2026</DialogTitle>
          <DialogDescription>Консолидиран отчет към Контролния съвет</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="Приходи" value={formatEUR(derived.income)} />
          <MiniStat label="Разходи" value={formatEUR(derived.expensesTotal)} />
          <MiniStat label="Нетно" value={formatEUR(derived.net, { sign: true })} />
        </div>
        <ol className="space-y-2">
          {REPORT_STEPS.map((s, i) => {
            const state_ = i < step ? "done" : i === step ? "active" : "todo";
            return (
              <li key={s} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors", state_ === "todo" ? "text-muted-foreground" : "bg-muted/60")}>
                <span className={cn("grid size-6 place-items-center rounded-full", state_ === "done" ? "bg-success text-success-foreground" : "bg-muted")}>
                  {state_ === "done" ? <Check className="size-3.5" /> : state_ === "active" ? <Loader2 className="size-3.5 animate-spin" /> : <span className="size-1.5 rounded-full bg-muted-foreground" />}
                </span>
                {s}
                {i === 1 && <span className="ml-auto text-xs text-muted-foreground">{state.expenses.length} бр.</span>}
              </li>
            );
          })}
        </ol>
        {done && (
          <div className="flex flex-col gap-2 rounded-2xl bg-success/12 p-4 animate-fade-up sm:flex-row sm:items-center">
            <CheckCircle2 className="size-6 shrink-0 text-success" />
            <p className="flex-1 text-sm font-medium">Изпратено до 2 членове на КС. Статус: Чака верификация.</p>
            <Button size="sm" asChild>
              <Link to="/kontrolen-savet" onClick={() => onOpenChange(false)}>
                <Landmark /> Към портала на КС
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-2 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="tabular text-sm font-bold">{value}</p>
    </div>
  );
}
