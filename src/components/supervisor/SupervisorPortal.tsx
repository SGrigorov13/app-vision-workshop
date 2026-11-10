import { useLang } from "@/lib/i18n";
import {
  CheckCircle2,
  Clock,
  FileText,
  Fingerprint,
  Loader2,
  RotateCcw,
  Scale,
  ShieldCheck,
  Stamp,
  ThumbsDown,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatEUR } from "@/lib/format";
import { BUILDING, EXPENSE_CATEGORY_LABEL, FUND_META, SUPERVISORS, type Expense } from "@/lib/mock-data";
import { useMockStore, type ReportStatus, type VoteState } from "@/lib/mock-store";
import { cn } from "@/lib/utils";

const MIN_COMMENT = 10;

export function SupervisorPortal() {
  const { l } = useLang();
  const { state, derived, castVote, rejectReport, resetReport } = useMockStore();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [invoice, setInvoice] = useState<Expense | null>(null);
  const status = derived.reportStatus;
  const myVote = state.votes.ivan;
  const decided = myVote.status === "approved" || myVote.status === "rejected";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-fade-up">
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Scale className="size-4" /> {l("Портал на Контролния съвет", "Supervisory board portal")} • {address}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Тримесечен отчет Q4-2026</h1>
          <p className="mt-1 text-xs text-muted-foreground">Получен от Домоуправителя на {state.reportSentAt}</p>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Financial summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={TrendingUp} label="Общо приходи" value={formatEUR(derived.income)} tone="bg-success/14 text-success" />
        <SummaryCard icon={TrendingDown} label="Общо разходи" value={formatEUR(derived.expensesTotal)} tone="bg-destructive/12 text-destructive" />
        <SummaryCard
          icon={Wallet}
          label="Нетен баланс"
          value={formatEUR(derived.net, { sign: true })}
          tone="bg-accent text-accent-foreground"
          highlight
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Tracker */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Верификация от членовете</h2>
            <Badge variant="secondary" className="tabular">
              <Users /> {Object.values(state.votes).filter((v) => v.status === "approved").length}/{SUPERVISORS.length}
            </Badge>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-warning/14 p-3 text-xs">
            <Scale className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
            <p>
              <b>Строго правило за кворум:</b> отчетът се приема само при <b>100% консенсус</b> — всички {SUPERVISORS.length} членове на Контролния съвет трябва да го одобрят.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {SUPERVISORS.map((s) => (
              <VoterRow
                key={s.id}
                name={l(s.name)}
                role={l(s.role)}
                initials={l(s.initials)}
                isYou={s.isYou}
                vote={state.votes[s.id]}
                onSimulate={
                  s.id === "elena" && state.votes.elena.status === "pending" && status !== "REJECTED"
                    ? async () => {
                        await castVote("elena");
                        toast.success("Елена Димитрова одобри отчета", { description: "Подписано с SHA-256" });
                      }
                    : undefined
                }
              />
            ))}
          </div>

          {status === "APPROVED" && (
            <div className="relative mt-5 overflow-hidden rounded-2xl bg-success/12 p-4 text-center">
              <div className="mx-auto w-fit rounded-xl border-4 border-success px-4 py-2 text-success animate-stamp">
                <p className="font-display text-sm font-extrabold tracking-wider">ОДОБРЕН И ПРИЕТ</p>
                <p className="text-[10px] font-bold">100% КОНСЕНСУС • Q4-2026</p>
              </div>
            </div>
          )}

          {status === "REJECTED" && state.rejectComment && (
            <div className="mt-5 rounded-2xl bg-destructive/10 p-4 text-sm animate-fade-up">
              <p className="font-semibold text-destructive">Върнат за корекция</p>
              <p className="mt-1 text-muted-foreground">„{state.rejectComment}“</p>
            </div>
          )}

          {(decided || state.votes.elena.status !== "pending") && (
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={resetReport}>
              <RotateCcw /> Нулирай гласуването (демо)
            </Button>
          )}
        </div>

        {/* Invoices */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Разходи и фактури</h2>
            <span className="text-xs text-muted-foreground">{state.expenses.length} документа</span>
          </div>
          <div className="no-scrollbar mt-3 max-h-[440px] divide-y divide-border overflow-y-auto">
            {state.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l(e.description)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.date} • {l(e.provider)} • {l(FUND_META[e.fund].label)}
                  </p>
                </div>
                <p className="tabular text-sm font-bold">{formatEUR(e.amount)}</p>
                <button
                  onClick={() => setInvoice(e)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/12 px-2.5 py-1 text-[11px] font-bold text-destructive transition-transform hover:scale-105"
                >
                  <FileText className="size-3.5" /> PDF
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>Общо разходи</span>
            <span className="tabular">{formatEUR(derived.expensesTotal)}</span>
          </div>
        </div>
      </div>

      {/* Decision controls */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          variant="success"
          size="xl"
          className="h-20 text-lg"
          disabled={decided || status === "REJECTED"}
          onClick={() => setApproveOpen(true)}
        >
          <ShieldCheck className="!size-6" /> Потвърди верификация (Approve)
        </Button>
        <Button
          variant="destructive"
          size="xl"
          className="h-20 text-lg"
          disabled={decided || status === "APPROVED"}
          onClick={() => setRejectOpen(true)}
        >
          <ThumbsDown className="!size-6" /> Върни за корекция (Reject)
        </Button>
      </div>

      <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen} />
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onSubmit={(c) => {
          rejectReport(c);
          setRejectOpen(false);
          toast.error("Отчетът е върнат за корекция", { description: "Домоуправителят е уведомен с вашия коментар." });
        }}
      />
      <InvoiceDialog expense={invoice} onClose={() => setInvoice(null)} />
    </div>
  );
}

function StatusPill({ status }: { status: ReportStatus }) {
  if (status === "APPROVED")
    return (
      <Badge variant="success" className="animate-pop px-4 py-2 text-sm">
        <CheckCircle2 className="!size-4" /> ОДОБРЕН И ПРИЕТ (100% Консенсус)
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge variant="destructive" className="px-4 py-2 text-sm">
        <XCircle className="!size-4" /> Върнат за корекция (REJECTED)
      </Badge>
    );
  return (
    <Badge variant="warning" className="px-4 py-2 text-sm">
      <span className="size-2 rounded-full bg-warning animate-ring" /> Чака верификация (UNDER_REVIEW)
    </Badge>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
  highlight,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border p-5 shadow-card animate-fade-up",
        highlight ? "bg-gradient-brand text-primary-foreground" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-sm font-semibold", highlight ? "opacity-80" : "text-muted-foreground")}>{label}</p>
        <span className={cn("grid size-9 place-items-center rounded-xl", highlight ? "bg-primary-foreground/15" : tone)}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-bold sm:text-3xl">{value}</p>
    </div>
  );
}

function VoterRow({
  name,
  role,
  initials,
  isYou,
  vote,
  onSimulate,
}: {
  name: string;
  role: string;
  initials: string;
  isYou: boolean;
  vote: VoteState;
  onSimulate?: (() => void) | undefined;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition-colors",
        vote.status === "approved" ? "border-success/40 bg-success/8" : vote.status === "rejected" ? "border-destructive/40 bg-destructive/8" : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {name} {isYou && <span className="text-muted-foreground">(Вие)</span>}
          </p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        {vote.status === "approved" && <CheckCircle2 className="size-6 text-success animate-pop" />}
        {vote.status === "rejected" && <XCircle className="size-6 text-destructive animate-pop" />}
        {vote.status === "voting" && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {vote.status === "pending" && <Clock className="size-5 text-muted-foreground" />}
      </div>

      <div className="mt-2 text-xs">
        {vote.status === "approved" && (
          <div className="animate-fade-up">
            <p className="font-semibold text-success">Одобрен с SHA-256 хеш • {vote.at}</p>
            <p className="tabular mt-1 flex items-center gap-1 break-all rounded-lg bg-card px-2 py-1 text-[10px] text-muted-foreground">
              <Fingerprint className="size-3 shrink-0" /> {vote.hash}
            </p>
          </div>
        )}
        {vote.status === "rejected" && <p className="font-semibold text-destructive">Върнат за корекция • {vote.at}</p>}
        {vote.status === "voting" && <p className="shimmer-text font-semibold">Подписване с SHA-256…</p>}
        {vote.status === "pending" && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground">{isYou ? "Очаква вашия вот" : "Чака се гласуване..."}</p>
            {onSimulate && (
              <Button size="sm" variant="outline" onClick={onSimulate}>
                Симулирай вот на Елена
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ApproveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { castVote, derived } = useMockStore();
  const [phase, setPhase] = useState<"confirm" | "signing" | "done">("confirm");
  const [hash, setHash] = useState("");

  const sign = async () => {
    setPhase("signing");
    const h = await castVote("ivan");
    setHash(h);
    setPhase("done");
    toast.success("Вашата верификация е подписана", { description: `SHA-256: ${h.slice(0, 16)}…` });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (phase === "signing") return;
        onOpenChange(o);
        if (!o) setTimeout(() => setPhase("confirm"), 200);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Дигитален печат</DialogTitle>
          <DialogDescription>
            Потвърждавате, че сте проверили приходите, разходите и прикачените фактури за Q4-2026.
          </DialogDescription>
        </DialogHeader>
        {phase === "done" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="rounded-2xl border-4 border-success px-6 py-3 text-success animate-stamp">
              <Stamp className="mx-auto size-8" />
              <p className="font-display mt-1 text-sm font-extrabold tracking-wider">ВЕРИФИЦИРАНО</p>
              <p className="text-[10px] font-bold">Иван Георгиев • КС</p>
            </div>
            <p className="tabular mt-4 break-all rounded-xl bg-muted px-3 py-2 text-[10px] text-muted-foreground">{hash}</p>
            <Button className="mt-5 w-full" size="lg" onClick={() => onOpenChange(false)}>
              Затвори
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Приходи", formatEUR(derived.income)],
                ["Разходи", formatEUR(derived.expensesTotal)],
                ["Баланс", formatEUR(derived.net, { sign: true })],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-muted/60 px-2 py-3">
                  <p className="text-[11px] text-muted-foreground">{l}</p>
                  <p className="tabular text-sm font-bold">{v}</p>
                </div>
              ))}
            </div>
            <Button variant="success" size="lg" onClick={sign} disabled={phase === "signing"}>
              {phase === "signing" ? (
                <>
                  <Loader2 className="animate-spin" /> Генериране на SHA-256 подпис…
                </>
              ) : (
                <>
                  <Stamp /> Подпиши и одобри
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);
  const tooShort = comment.trim().length < MIN_COMMENT;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setComment("");
          setTouched(false);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Върни за корекция</DialogTitle>
          <DialogDescription>Задължително опишете какво трябва да коригира Домоуправителят.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Напр. Липсва фактура за ремонта на покрива от 20.11.2026…"
          className="min-h-28 rounded-2xl"
          aria-invalid={touched && tooShort}
        />
        {touched && tooShort && (
          <p className="-mt-2 text-xs font-medium text-destructive">Коментарът трябва да е поне {MIN_COMMENT} символа.</p>
        )}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => {
            setTouched(true);
            if (!tooShort) {
              onSubmit(comment.trim());
              setComment("");
              setTouched(false);
            }
          }}
        >
          <ThumbsDown /> Изпрати за корекция
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDialog({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { l } = useLang();
  return (
    <Dialog open={!!expense} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-destructive" /> {expense?.invoice}
          </DialogTitle>
          <DialogDescription>Прикачен документ към разхода</DialogDescription>
        </DialogHeader>
        {expense && (
          <div className="rounded-2xl border border-border bg-qr p-5 font-sans text-qr-foreground">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold">ФАКТУРА</p>
                <p className="text-xs opacity-70">№ {expense.invoice.replace(/\.pdf$/, "")}</p>
              </div>
              <p className="text-right text-xs opacity-70">Дата: {expense.date}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold opacity-60">Доставчик</p>
                <p className="font-medium">{l(expense.provider)}</p>
              </div>
              <div>
                <p className="font-semibold opacity-60">Получател</p>
                <p className="font-medium">{l(BUILDING.beneficiary)}</p>
              </div>
            </div>
            <div className="mt-4 border-y border-qr-foreground/15 py-3 text-xs">
              <div className="flex justify-between gap-3">
                <span>{l(expense.description)}</span>
                <span className="tabular font-semibold">{formatEUR(expense.amount)}</span>
              </div>
              <p className="mt-1 opacity-60">Категория: {l(EXPENSE_CATEGORY_LABEL[expense.category])} • {l(FUND_META[expense.fund].label)}</p>
            </div>
            <div className="mt-3 flex justify-between text-sm font-bold">
              <span>Общо за плащане</span>
              <span className="tabular">{formatEUR(expense.amount)}</span>
            </div>
            <p className="mt-4 text-[10px] opacity-50">Валута: EUR • Документът е генериран за демо целите на VhodArena.eu</p>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => {
            toast.success("Фактурата се изтегля", { description: expense?.invoice });
          }}
        >
          Изтегли PDF
        </Button>
      </DialogContent>
    </Dialog>
  );
}
