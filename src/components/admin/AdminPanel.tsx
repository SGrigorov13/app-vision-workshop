import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Lock,
  Mail,
  Plus,
  QrCode,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { InviteCard } from "./InviteCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BASE_UNITS,
  PAY_DEADLINE_DAY,
  STEP_UNITS,
  addMonths,
  extraBlocks,
  nextDeadline,
  subscriptionPrice,
  type AccessStatus,
  type Plan,
} from "@/lib/billing";
import { useLang } from "@/lib/i18n";
import { validatePeople, type People, type Person, type ResidentPerson } from "@/lib/invitations";
import { usePlatform, type Building, type CondoRecord } from "@/lib/platform-store";
import { validateCondo } from "@/lib/treasury";
import { cn } from "@/lib/utils";

export type AdminTab = "condos" | "new" | "billing";

const MONTHS_BG = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function useMonthLabel() {
  const { lang } = useLang();
  return (ym: string) => {
    const [y, m] = ym.split("-");
    return `${(lang === "bg" ? MONTHS_BG : MONTHS_EN)[Number(m) - 1]} ${y}`;
  };
}

export function AdminPanel({ tab }: { tab: AdminTab }) {
  const { l } = useLang();
  const navigate = useNavigate();
  const setTab = (t: string) => void navigate({ to: "/admin", search: { tab: t as AdminTab }, replace: true });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{l("Админ панел", "Admin panel")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {l("Етажни собствености, покани за потребители и абонамент.", "Condominiums, user invitations and subscription.")}
      </p>
      <Tabs value={tab} onValueChange={setTab} className="mt-5">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
          <TabsTrigger value="condos">{l("Сгради", "Buildings")}</TabsTrigger>
          <TabsTrigger value="new">{l("Нова регистрация", "New registration")}</TabsTrigger>
          <TabsTrigger value="billing">{l("Абонамент", "Subscription")}</TabsTrigger>
        </TabsList>
        <TabsContent value="condos">
          <CondosTab onNew={() => setTab("new")} />
        </TabsContent>
        <TabsContent value="new">
          <RegistrationWizard onDone={() => setTab("condos")} />
        </TabsContent>
        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Status badge ---------------- */

export function AccessBadge({ status }: { status: AccessStatus }) {
  const { l } = useLang();
  if (status === "blocked")
    return (
      <Badge variant="destructive">
        <Lock className="size-3" /> {l("Достъпът е спрян", "Blocked")}
      </Badge>
    );
  if (status === "due")
    return (
      <Badge variant="warning">
        <CalendarClock className="size-3" /> {l("Предстои плащане", "Payment due")}
      </Badge>
    );
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3" /> {l("Активен", "Active")}
    </Badge>
  );
}

/* ---------------- Buildings ---------------- */

function CondosTab({ onNew }: { onNew: () => void }) {
  const { l, eur } = useLang();
  const { condos, active, setActiveId, statusOf, setCashEnabled } = usePlatform();
  const [invitesFor, setInvitesFor] = useState<CondoRecord | null>(null);
  const month = useMonthLabel();

  return (
    <div className="grid gap-3">
      {condos.map((c) => {
        const st = statusOf(c);
        const accepted = c.invites.filter((i) => i.status === "accepted").length;
        return (
          <div key={c.id} className={cn("rounded-3xl border bg-card p-4 shadow-card sm:p-5", active.id === c.id ? "border-primary/50" : "border-border")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.address}, {c.city} · {c.units} {l("апартамента", "apartments")}
                  </p>
                </div>
              </div>
              <AccessBadge status={st} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Tile k={l("Абонамент", "Plan")} v={`${eur(subscriptionPrice(c.units, c.plan))} / ${c.plan === "annual" ? l("год.", "yr") : l("мес.", "mo")}`} />
              <Tile k={l("Платено до", "Paid through")} v={month(c.paidThrough)} />
              <Tile k={l("Домоуправител", "Manager")} v={c.people.manager.name} />
              <Tile k={l("Покани", "Invites")} v={`${accepted}/${c.invites.length} ${l("приети", "joined")}`} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {active.id === c.id ? (
                <Badge variant="soft">{l("Отворена в приложението", "Open in the app")}</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setActiveId(c.id); toast.success(l(`Отворена: ${c.name}`, `Opened: ${c.name}`)); }}>
                  {l("Отвори в приложението", "Open in the app")}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setInvitesFor(c)}>
                <QrCode /> {l("QR покани", "QR invites")}
              </Button>
              <label className="ml-auto flex items-center gap-2 text-xs font-semibold">
                <Banknote className="size-4 text-muted-foreground" />
                {l("Каса в брой", "Cash box")}
                <Switch checked={c.cashEnabled} onCheckedChange={(v) => setCashEnabled(c.id, v)} aria-label={l("Каса в брой", "Cash box")} />
              </label>
            </div>
          </div>
        );
      })}
      <Button variant="soft" className="w-full sm:w-fit" onClick={onNew}>
        <Plus /> {l("Регистрирай етажна собственост", "Register a condominium")}
      </Button>

      <Dialog open={!!invitesFor} onOpenChange={(o) => !o && setInvitesFor(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{l("QR покани", "QR invites")} — {invitesFor?.name}</DialogTitle>
            <DialogDescription>{l("Всеки потребител се регистрира със своя QR код.", "Each user registers with their own QR code.")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            {invitesFor?.invites.map((i) => <InviteCard key={i.id} invite={i} condoName={invitesFor.name} />)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-muted-foreground">{k}</p>
      <p className="truncate font-semibold">{v}</p>
    </div>
  );
}

/* ---------------- Registration wizard ---------------- */

const EMPTY_BUILDING: Building = { name: "", address: "", city: "София", postcode: "", bulstat: "", floors: 1, units: 1, iban: "", bic: "", mandateUntil: "" };
const uid = () => Math.random().toString(36).slice(2, 9);
const person = (): Person => ({ id: uid(), name: "", email: "" });
const resident = (): ResidentPerson => ({ ...person(), apartment: "" });

const STEPS = [
  { bg: "Сграда", en: "Building" },
  { bg: "Сметка и каси", en: "Account & cash" },
  { bg: "Хора", en: "People" },
  { bg: "Абонамент", en: "Subscription" },
];

function RegistrationWizard({ onDone }: { onDone: () => void }) {
  const { l, eur } = useLang();
  const { registerCondo, setActiveId } = usePlatform();
  const [step, setStep] = useState(0);
  const [b, setB] = useState<Building>(EMPTY_BUILDING);
  const [cashEnabled, setCash] = useState(true);
  const [people, setPeople] = useState<People>({ manager: person(), cashierSameAsManager: true, cashier: person(), board: [person()], residents: [resident()] });
  const [plan, setPlan] = useState<Plan>("monthly");
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState<CondoRecord | null>(null);

  const setField = <K extends keyof Building>(k: K, v: Building[K]) => setB((s) => ({ ...s, [k]: v }));
  const err = (k: string) => errors.includes(k);

  const validateStep = (i: number) => {
    const full = { ...b, manager: people.manager.name || "x", cashier: "", board: "" };
    const e = i === 0 ? validateCondo(full).filter((x) => x !== "iban") : i === 1 ? validateCondo(full).filter((x) => x === "iban") : i === 2 ? validatePeople(people) : [];
    setErrors(e);
    if (e.length) toast.error(l("Проверете отбелязаните полета", "Check the highlighted fields"));
    return e.length === 0;
  };

  const next = () => validateStep(step) && setStep((s) => s + 1);

  const finalize = () => {
    for (const i of [0, 1, 2]) if (!validateStep(i)) return setStep(i);
    const c = registerCondo(b, people, plan, cashEnabled);
    setDone(c);
    toast.success(l(`Изпратени са ${c.invites.length} QR покани по имейл`, `${c.invites.length} QR invites e-mailed`), {
      description: c.invites.map((i) => i.email).join(", "),
    });
  };

  if (done)
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-success/12 p-5 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" />
          <p className="mt-2 text-lg font-bold">{l("Регистрацията е завършена", "Registration complete")}</p>
          <p className="text-sm text-muted-foreground">
            {l(`QR кодовете са изпратени до ${done.invites.length} имейла. Всеки потребител влиза в своя раздел след регистрация.`, `QR codes were sent to ${done.invites.length} e-mails. Each user lands in their section after registering.`)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {l("Демо: имейлите се симулират — реалното изпращане изисква домейн за изпращане.", "Demo: e-mails are simulated — real sending needs a sender domain.")}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {done.invites.map((i) => <InviteCard key={i.id} invite={i} condoName={done.name} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setActiveId(done.id); onDone(); }}>{l("Отвори етажната собственост", "Open the condominium")}</Button>
          <Button variant="outline" onClick={() => { setDone(null); setStep(0); setB(EMPTY_BUILDING); setPeople({ manager: person(), cashierSameAsManager: true, cashier: person(), board: [person()], residents: [resident()] }); }}>
            {l("Нова регистрация", "New registration")}
          </Button>
        </div>
      </div>
    );

  const F = (k: keyof Building, label: string, opts: { type?: string; span?: boolean } = {}) => (
    <div className={cn("space-y-1", opts.span && "sm:col-span-2")}>
      <Label htmlFor={`b-${k}`}>{label}</Label>
      <Input
        id={`b-${k}`}
        type={opts.type ?? "text"}
        inputMode={opts.type === "number" ? "numeric" : undefined}
        value={String(b[k])}
        aria-invalid={err(k)}
        className={err(k) ? "border-destructive" : ""}
        onChange={(e) => setField(k, (opts.type === "number" ? Number(e.target.value) : e.target.value) as never)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-4 gap-1">
        {STEPS.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => i < step && setStep(i)}
              className={cn("w-full rounded-full px-2 py-1.5 text-[11px] font-bold sm:text-xs", i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}
            >
              {i + 1}. {l(s)}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 sm:p-6">
          {F("name", l("Наименование на ЕС *", "Condominium name *"), { span: true })}
          {F("address", l("Адрес *", "Address *"), { span: true })}
          {F("city", l("Град", "City"))}
          {F("postcode", l("Пощенски код", "Postcode"))}
          {F("bulstat", l("БУЛСТАТ", "BULSTAT"))}
          {F("floors", l("Етажи", "Floors"), { type: "number" })}
          {F("units", l("Брой апартаменти / обекти *", "Apartments / units *"), { type: "number" })}
          {F("mandateUntil", l("Мандат на органите до", "Board mandate until"), { type: "date" })}
        </section>
      )}

      {step === 1 && (
        <section className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 sm:p-6">
          {F("iban", "IBAN")}
          {F("bic", "BIC")}
          <label className="flex items-start gap-3 rounded-2xl bg-muted/60 p-3 sm:col-span-2">
            <Switch checked={cashEnabled} onCheckedChange={setCash} className="mt-0.5" />
            <span>
              <span className="block text-sm font-semibold">{l("Активирай каса в брой", "Enable the cash box")}</span>
              <span className="block text-xs text-muted-foreground">
                {l("Домоуправителят / касиерът ще може да въвежда приходи, платени в брой.", "The manager / cashier can enter income paid in cash.")}
              </span>
            </span>
          </label>
        </section>
      )}

      {step === 2 && <PeopleStep people={people} setPeople={setPeople} errors={errors} />}

      {step === 3 && (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-card sm:p-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {(["monthly", "annual"] as Plan[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={cn("rounded-2xl border-2 p-4 text-left transition-colors", plan === p ? "border-primary bg-accent/40" : "border-border")}
              >
                <p className="text-sm font-semibold">{p === "monthly" ? l("Месечно", "Monthly") : l("Годишно", "Yearly")}</p>
                <p className="font-display text-2xl font-bold">{eur(subscriptionPrice(b.units, p))}</p>
                <p className="text-xs text-muted-foreground">
                  {p === "monthly" ? l("на месец", "per month") : l(`на година · спестявате ${eur(subscriptionPrice(b.units, "monthly") * 12 - subscriptionPrice(b.units, "annual"))}`, `per year · save ${eur(subscriptionPrice(b.units, "monthly") * 12 - subscriptionPrice(b.units, "annual"))}`)}
                </p>
              </button>
            ))}
          </div>
          <PriceExplain units={b.units} />
          <div className="rounded-2xl bg-muted/60 p-3 text-sm">
            <p className="font-semibold">{b.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{b.address} · {b.units} {l("апартамента", "apartments")}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs">
              <Mail className="size-3.5" />
              {l("QR покани ще получат", "QR invites go to")}: {1 + (people.cashierSameAsManager ? 0 : 1) + people.board.length + people.residents.length} {l("души", "people")}
            </p>
          </div>
        </section>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" disabled={step === 0} onClick={() => { setErrors([]); setStep((s) => s - 1); }}>
          <ArrowLeft /> {l("Назад", "Back")}
        </Button>
        {step < 3 ? (
          <Button onClick={next}>
            {l("Напред", "Next")} <ArrowRight />
          </Button>
        ) : (
          <Button variant="success" onClick={finalize}>
            <CreditCard /> {l("Плати и изпрати поканите", "Pay & send invites")}
          </Button>
        )}
      </div>
    </div>
  );
}

function PeopleStep({ people, setPeople, errors }: { people: People; setPeople: (fn: (p: People) => People) => void; errors: string[] }) {
  const { l } = useLang();
  const err = (k: string) => errors.includes(k);
  const row = (prefix: string, x: Person, onChange: (x: Person) => void, onRemove?: () => void) => (
    <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <Input placeholder={l("Име и фамилия", "Full name")} value={x.name} aria-invalid={err(`${prefix}.name`)} className={err(`${prefix}.name`) ? "border-destructive" : ""} onChange={(e) => onChange({ ...x, name: e.target.value })} />
      <Input type="email" inputMode="email" placeholder="email@example.com" value={x.email} aria-invalid={err(`${prefix}.email`)} className={cn("col-span-1 row-start-2 sm:row-start-auto", err(`${prefix}.email`) ? "border-destructive" : "")} onChange={(e) => onChange({ ...x, email: e.target.value })} />
      {onRemove ? (
        <Button variant="ghost" size="icon" className="row-span-2 sm:row-span-1" aria-label={l("Премахни", "Remove")} onClick={onRemove}>
          <Trash2 />
        </Button>
      ) : (
        <span className="hidden sm:block sm:w-10" />
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <Group title={l("Домоуправител *", "Manager *")}>
        {row("manager", people.manager, (x) => setPeople((p) => ({ ...p, manager: x })))}
      </Group>

      <Group title={l("Касиер", "Cashier")}>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={people.cashierSameAsManager} onCheckedChange={(c) => setPeople((p) => ({ ...p, cashierSameAsManager: c === true }))} />
          {l("Касиерът е домоуправителят", "The manager is also the cashier")}
        </label>
        {!people.cashierSameAsManager && row("cashier", people.cashier, (x) => setPeople((p) => ({ ...p, cashier: x })))}
      </Group>

      <Group title={l("Контролен съвет * (един или повече)", "Supervisory board * (one or more)")} error={err("board")}>
        {people.board.map((x, i) =>
          row(`board.${i}`, x, (v) => setPeople((p) => ({ ...p, board: p.board.map((y, j) => (j === i ? v : y)) })), people.board.length > 1 ? () => setPeople((p) => ({ ...p, board: p.board.filter((_, j) => j !== i) })) : undefined),
        )}
        <Button size="sm" variant="ghost" className="w-fit" onClick={() => setPeople((p) => ({ ...p, board: [...p.board, person()] }))}>
          <Plus /> {l("Добави член", "Add member")}
        </Button>
      </Group>

      <Group title={l("Живущи * (един или повече)", "Residents * (one or more)")} error={err("residents")}>
        {people.residents.map((x, i) => (
          <div key={x.id} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <Input placeholder={l("Ап.", "Apt.")} value={x.apartment} aria-invalid={err(`residents.${i}.apartment`)} className={err(`residents.${i}.apartment`) ? "border-destructive" : ""} onChange={(e) => setPeople((p) => ({ ...p, residents: p.residents.map((y, j) => (j === i ? { ...y, apartment: e.target.value } : y)) }))} />
            {row(`residents.${i}`, x, (v) => setPeople((p) => ({ ...p, residents: p.residents.map((y, j) => (j === i ? { ...y, ...v } : y)) })), people.residents.length > 1 ? () => setPeople((p) => ({ ...p, residents: p.residents.filter((_, j) => j !== i) })) : undefined)}
          </div>
        ))}
        <Button size="sm" variant="ghost" className="w-fit" onClick={() => setPeople((p) => ({ ...p, residents: [...p.residents, resident()] }))}>
          <Plus /> {l("Добави живущ", "Add resident")}
        </Button>
      </Group>
    </div>
  );
}

function Group({ title, error, children }: { title: string; error?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("grid gap-2 rounded-3xl border bg-card p-4 shadow-card sm:p-5", error ? "border-destructive" : "border-border")}>
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <Users className="size-4 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------------- Billing ---------------- */

function PriceExplain({ units }: { units: number }) {
  const { l, eur } = useLang();
  const blocks = extraBlocks(units);
  return (
    <p className="text-xs text-muted-foreground">
      {blocks === 0
        ? l(`До ${BASE_UNITS} апартамента: ${eur(4.99)}/мес. или ${eur(49.99)}/год.`, `Up to ${BASE_UNITS} apartments: ${eur(4.99)}/mo or ${eur(49.99)}/yr.`)
        : l(
            `${units} ап. = ${BASE_UNITS} + ${blocks} × до ${STEP_UNITS} ап. → ${eur(4.99)} + ${blocks} × ${eur(1)} на месец, или ${eur(49.99)} + ${blocks} × ${eur(10)} на година.`,
            `${units} apts = ${BASE_UNITS} + ${blocks} × up to ${STEP_UNITS} → ${eur(4.99)} + ${blocks} × ${eur(1)} per month, or ${eur(49.99)} + ${blocks} × ${eur(10)} per year.`,
          )}
    </p>
  );
}

function BillingTab() {
  const { l, eur } = useLang();
  const { condos, statusOf, paySubscription, demoDate, setDemoDate, today } = usePlatform();
  const [calcUnits, setCalcUnits] = useState(44);
  const [paying, setPaying] = useState<{ c: CondoRecord; plan: Plan } | null>(null);
  const month = useMonthLabel();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
        <h2 className="font-bold">{l("Цени", "Pricing")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="calc-units">{l("Брой апартаменти", "Apartments")}</Label>
            <Input id="calc-units" type="number" inputMode="numeric" min={1} value={calcUnits} onChange={(e) => setCalcUnits(Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <Tile k={l("Месечно", "Monthly")} v={eur(subscriptionPrice(calcUnits, "monthly"))} />
          <Tile k={l("Годишно", "Yearly")} v={eur(subscriptionPrice(calcUnits, "annual"))} />
        </div>
        <div className="mt-2">
          <PriceExplain units={calcUnits} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {l(
            `Таксата покрива съхранението на документи и данни в облака и поддръжката на приложението. Ако следващият месец не е платен до ${PAY_DEADLINE_DAY}-то число на текущия, достъпът до съответната етажна собственост се спира.`,
            `The fee covers cloud storage of documents and data plus app maintenance. If next month is not paid by the ${PAY_DEADLINE_DAY}th of the current month, access to that condominium is suspended.`,
          )}
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-border p-4 text-sm">
        <p className="font-semibold">{l("Демо: днешна дата", "Demo: today's date")}</p>
        <p className="text-xs text-muted-foreground">{l("Сменете датата, за да видите кога се спира достъпът.", "Change the date to see when access is suspended.")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input type="date" className="w-44" value={demoDate ?? today.toISOString().slice(0, 10)} onChange={(e) => setDemoDate(e.target.value || null)} />
          {demoDate && (
            <Button size="sm" variant="ghost" onClick={() => setDemoDate(null)}>
              {l("Реална дата", "Real date")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {condos.map((c) => (
          <div key={c.id} className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.units} {l("апартамента", "apartments")} · {l("платено до", "paid through")} {month(c.paidThrough)} · {l("следващо плащане до", "next payment by")} {nextDeadline(c.paidThrough)}
                </p>
              </div>
              <AccessBadge status={statusOf(c)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setPaying({ c, plan: "monthly" })}>
                {l("Плати 1 месец", "Pay 1 month")} · {eur(subscriptionPrice(c.units, "monthly"))}
              </Button>
              <Button size="sm" onClick={() => setPaying({ c, plan: "annual" })}>
                {l("Плати 12 месеца", "Pay 12 months")} · {eur(subscriptionPrice(c.units, "annual"))}
              </Button>
            </div>
            {c.payments.length > 0 && (
              <div className="mt-3 divide-y divide-border rounded-2xl bg-muted/40 text-xs">
                {c.payments.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex justify-between gap-2 px-3 py-2">
                    <span>
                      {p.date} · {p.from === p.to ? month(p.from) : `${month(p.from)} – ${month(p.to)}`}
                    </span>
                    <span className="font-semibold tabular-nums">{eur(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l("Плащане на абонамент", "Pay subscription")}</DialogTitle>
            <DialogDescription>{paying?.c.name}</DialogDescription>
          </DialogHeader>
          {paying && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/60 p-4 text-center">
                <p className="font-display text-3xl font-bold">{eur(subscriptionPrice(paying.c.units, paying.plan))}</p>
                <p className="text-xs text-muted-foreground">
                  {month(addMonths(paying.c.paidThrough, 1))}
                  {paying.plan === "annual" ? ` – ${month(addMonths(paying.c.paidThrough, 12))}` : ""}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{l("Демо плащане — няма да бъде таксувана карта.", "Demo payment — no card will be charged.")}</p>
              <Button
                className="w-full"
                variant="success"
                onClick={() => {
                  paySubscription(paying.c.id, paying.plan);
                  toast.success(l("Плащането е прието", "Payment received"), { description: paying.c.name });
                  setPaying(null);
                }}
              >
                <CreditCard /> {l("Плати", "Pay")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
