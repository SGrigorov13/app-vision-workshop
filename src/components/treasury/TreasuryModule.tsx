import { ArrowRightLeft, Banknote, Landmark, Printer, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatEUR } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import {
  CASHBOX_LABEL,
  INITIAL_TXS,
  OPENING,
  boxBalance,
  monthlyReports,
  summarize,
  verify,
  type CashboxId,
  type PeriodKind,
  type Tx,
  type TxKind,
  type Verification,
} from "@/lib/treasury";
import { cn } from "@/lib/utils";

const BG_MONTHS = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TreasuryModule() {
  const { lang, l } = useLang();
  const eur = (n: number) => formatEUR(n, { lang });
  const [txs, setTxs] = useState<Tx[]>(INITIAL_TXS);
  const [verifs, setVerifs] = useState<Record<string, Verification>>({});

  const cash = boxBalance(OPENING, txs, "cash");
  const bank = boxBalance(OPENING, txs, "bank");
  const months = useMemo(() => monthlyReports(txs), [txs]);
  const monthName = (m: string) => {
    const [y, mm] = m.split("-");
    return `${(lang === "bg" ? BG_MONTHS : EN_MONTHS)[Number(mm) - 1]} ${y}`;
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-3 py-5 sm:px-6">
      <div className="print:hidden">
        <h1 className="font-display text-2xl font-bold">{l("Каси и отчети", "Cash boxes & reports")}</h1>
        <p className="text-sm text-muted-foreground">
          {l("Месечни отчети, обобщени на 3 и 6 месеца и проверени от Контролния съвет.", "Monthly reports rolled up per 3 and 6 months and checked by the board.")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        <BalanceCard icon={<Banknote />} label={l(CASHBOX_LABEL.cash)} value={eur(cash)} />
        <BalanceCard icon={<Landmark />} label={l(CASHBOX_LABEL.bank)} value={eur(bank)} />
        <BalanceCard icon={<ShieldCheck />} label={l("Общо наличност", "Total")} value={eur(cash + bank)} strong />
      </div>

      <Tabs defaultValue="tx">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto print:hidden">
          <TabsTrigger value="tx">{l("Движения", "Transactions")}</TabsTrigger>
          <TabsTrigger value="month">{l("Месечни отчети", "Monthly")}</TabsTrigger>
          <TabsTrigger value="verify">{l("Проверка от КС", "Board check")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tx" className="space-y-4">
          <NewTx onAdd={(t) => setTxs((s) => [...s, t])} cash={cash} bank={bank} />
          <div className="divide-y rounded-2xl border bg-card">
            {[...txs].reverse().map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.date} ·{" "}
                    {t.kind === "transfer"
                      ? `${l(CASHBOX_LABEL[t.box])} → ${l(CASHBOX_LABEL[t.to!])}`
                      : l(CASHBOX_LABEL[t.box])}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-semibold tabular-nums",
                    t.kind === "income" && "text-success",
                    t.kind === "expense" && "text-destructive",
                  )}
                >
                  {t.kind === "expense" ? "−" : t.kind === "income" ? "+" : "⇄"} {eur(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <ReportTable title={l("По месеци", "By month")} rows={months.map((m) => ({ key: monthName(m.month), ...m }))} eur={eur} />
          <ReportTable
            title={l("По тримесечия", "By quarter")}
            rows={summarize(months, "Q").map((p) => ({ key: p.period, ...p }))}
            eur={eur}
          />
          <ReportTable
            title={l("По полугодия", "By half-year")}
            rows={summarize(months, "H").map((p) => ({ key: p.period, ...p }))}
            eur={eur}
          />
        </TabsContent>

        <TabsContent value="verify">
          <VerifyPanel
            months={months}
            bookCash={cash}
            bookBank={bank}
            verifs={verifs}
            onSave={(v) => setVerifs((s) => ({ ...s, [v.period]: v }))}
            eur={eur}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BalanceCard({ icon, label, value, strong }: { icon: React.ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-card", strong && "border-primary/40")}>
      <span className="grid size-10 place-items-center rounded-xl bg-muted text-primary [&_svg]:size-5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function NewTx({ onAdd, cash, bank }: { onAdd: (t: Tx) => void; cash: number; bank: number }) {
  const { l } = useLang();
  const [kind, setKind] = useState<TxKind>("income");
  const [box, setBox] = useState<CashboxId>("cash");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const submit = () => {
    const a = Number(amount.replace(",", "."));
    if (!(a > 0)) {
      toast.error(l("Въведете сума", "Enter an amount"));
      return;
    }
    const available = box === "cash" ? cash : bank;
    if (kind !== "income" && a > available) {
      toast.error(l("Недостатъчна наличност в касата", "Not enough in this box"));
      return;
    }
    const to: CashboxId = box === "cash" ? "bank" : "cash";
    onAdd({
      id: `t-${Date.now()}`,
      date,
      kind,
      amount: a,
      box,
      ...(kind === "transfer" ? { to } : {}),
      note: note || (kind === "transfer" ? l("Вътрешен трансфер", "Internal transfer") : kind === "income" ? l("Приход", "Income") : l("Разход", "Expense")),
    });
    setAmount("");
    setNote("");
    toast.success(l("Записано", "Saved"));
  };

  return (
    <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-6 sm:items-end">
      <div className="space-y-1">
        <Label>{l("Вид", "Type")}</Label>
        <Select value={kind} onValueChange={(v) => setKind(v as TxKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">{l("Приход", "Income")}</SelectItem>
            <SelectItem value="expense">{l("Разход", "Expense")}</SelectItem>
            <SelectItem value="transfer">{l("Трансфер", "Transfer")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{kind === "transfer" ? l("От каса", "From") : l("Каса", "Box")}</Label>
        <Select value={box} onValueChange={(v) => setBox(v as CashboxId)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">{l(CASHBOX_LABEL.cash)}</SelectItem>
            <SelectItem value="bank">{l(CASHBOX_LABEL.bank)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{l("Дата", "Date")}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>{l("Сума €", "Amount €")}</Label>
        <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
      </div>
      <div className="space-y-1">
        <Label>{l("Описание", "Note")}</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button onClick={submit} className="gap-1.5">
        {kind === "transfer" && <ArrowRightLeft className="size-4" />}
        {l("Добави", "Add")}
      </Button>
    </div>
  );
}

function ReportTable({
  title,
  rows,
  eur,
}: {
  title: string;
  rows: Array<{ key: string; income: number; expense: number; net: number }>;
  eur: (n: number) => string;
}) {
  const { l } = useLang();
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <h3 className="border-b px-4 py-2.5 font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">{l("Период", "Period")}</th>
              <th className="px-4 py-2 text-right">{l("Приходи", "Income")}</th>
              <th className="px-4 py-2 text-right">{l("Разходи", "Expenses")}</th>
              <th className="px-4 py-2 text-right">{l("Резултат", "Net")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t tabular-nums">
                <td className="px-4 py-2">{r.key}</td>
                <td className="px-4 py-2 text-right">{eur(r.income)}</td>
                <td className="px-4 py-2 text-right">{eur(r.expense)}</td>
                <td className={cn("px-4 py-2 text-right font-semibold", r.net < 0 && "text-destructive")}>{eur(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VerifyPanel({
  months,
  bookCash,
  bookBank,
  verifs,
  onSave,
  eur,
}: {
  months: ReturnType<typeof monthlyReports>;
  bookCash: number;
  bookBank: number;
  verifs: Record<string, Verification>;
  onSave: (v: Verification) => void;
  eur: (n: number) => string;
}) {
  const { l } = useLang();
  const [kind, setKind] = useState<PeriodKind>("Q");
  const periods = summarize(months, kind);
  const [period, setPeriod] = useState(periods.at(-1)?.period ?? "");
  const sel = periods.find((p) => p.period === period) ?? periods.at(-1);
  const saved = sel ? verifs[sel.period] : undefined;
  const [countedCash, setCountedCash] = useState("");
  const [bankStatement, setBankStatement] = useState("");
  const [docs, setDocs] = useState(false);
  const [remarks, setRemarks] = useState("");

  if (!sel) return null;

  const submit = () => {
    const v = {
      period: sel.period,
      countedCash: Number(countedCash.replace(",", ".")) || 0,
      bankStatement: Number(bankStatement.replace(",", ".")) || 0,
      documentsChecked: docs,
      remarks,
    };
    const status = verify(v, bookCash, bookBank);
    onSave({ ...v, status, signedAt: new Date().toLocaleString("bg-BG") });
    toast[status === "approved" ? "success" : "warning"](
      status === "approved" ? l("Отчетът е одобрен", "Report approved") : l("Записани са забележки", "Remarks recorded"),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Select value={kind} onValueChange={(v) => { setKind(v as PeriodKind); setPeriod(""); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Q">{l("Тримесечие", "Quarter")}</SelectItem>
            <SelectItem value="H">{l("Полугодие", "Half-year")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sel.period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.period} value={p.period}>{p.period}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold">
            {l("Констативен протокол на КС", "Board verification record")} — {sel.period}
          </h3>
          {saved && (
            <Badge variant={saved.status === "approved" ? "default" : "destructive"}>
              {saved.status === "approved" ? l("Одобрен", "Approved") : l("Със забележки", "With remarks")}
            </Badge>
          )}
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <Row k={l("Приходи за периода", "Period income")} v={eur(sel.income)} />
          <Row k={l("Разходи за периода", "Period expenses")} v={eur(sel.expense)} />
          <Row k={l("Резултат", "Net")} v={eur(sel.net)} />
          <Row k={l("Каса в брой по книги", "Cash per books")} v={eur(bookCash)} />
          <Row k={l("Банка по книги", "Bank per books")} v={eur(bookBank)} />
        </div>

        {saved ? (
          <div className="mt-4 space-y-1 text-sm">
            <p>{l("Преброени в брой", "Cash counted")}: <b>{eur(saved.countedCash)}</b></p>
            <p>{l("По извлечение", "Per statement")}: <b>{eur(saved.bankStatement)}</b></p>
            <p>{l("Документи проверени", "Documents checked")}: <b>{saved.documentsChecked ? l("Да", "Yes") : l("Не", "No")}</b></p>
            {saved.remarks && <p>{l("Забележки", "Remarks")}: {saved.remarks}</p>}
            <p className="text-muted-foreground">{l("Подписано", "Signed")}: {saved.signedAt}</p>
            <div className="mt-10 grid grid-cols-2 gap-8 pt-6 text-center text-xs text-muted-foreground">
              <div className="border-t pt-1">{l("Председател на КС", "Board chair")}</div>
              <div className="border-t pt-1">{l("Член на КС", "Board member")}</div>
            </div>
            <Button variant="outline" className="mt-4 gap-1.5 print:hidden" onClick={() => window.print()}>
              <Printer className="size-4" /> {l("Печат", "Print")}
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 print:hidden">
            <div className="space-y-1">
              <Label>{l("Преброена сума в брой €", "Cash counted €")}</Label>
              <Input inputMode="decimal" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{l("Салдо по банково извлечение €", "Bank statement balance €")}</Label>
              <Input inputMode="decimal" value={bankStatement} onChange={(e) => setBankStatement(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={docs} onCheckedChange={(c) => setDocs(c === true)} />
              {l("Всички фактури и квитанции са проверени", "All invoices and receipts checked")}
            </label>
            <div className="space-y-1 sm:col-span-2">
              <Label>{l("Забележки", "Remarks")}</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <Button onClick={submit} className="sm:col-span-2">{l("Подпиши проверката", "Sign verification")}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className="font-semibold tabular-nums">{v}</p>
    </div>
  );
}
