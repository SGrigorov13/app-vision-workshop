import { ArrowLeft, CalendarDays, CheckCircle2, FileSignature, Gavel, MapPin, Plus, Printer, Trash2, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import {
  INITIAL_MEETINGS,
  MAJORITY_LABEL,
  QUORUM_FIRST,
  QUORUM_POSTPONED,
  hasQuorum,
  isAdopted,
  representedParts,
  tally,
  type AgendaItem,
  type Attendance,
  type Majority,
  type Meeting,
  type Vote,
} from "@/lib/meetings";
import { BUILDING, INITIAL_APARTMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const UNITS = INITIAL_APARTMENTS.map((a) => ({ no: a.no, idealParts: a.idealParts, owner: a.owner }));

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

export function MeetingsModule() {
  const { l } = useLang();
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = meetings.find((m) => m.id === openId) ?? null;

  const update = (id: string, fn: (m: Meeting) => Meeting) => setMeetings((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));

  const createMeeting = () => {
    const id = `m-${Date.now()}`;
    const m: Meeting = {
      id,
      date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      time: "18:30",
      place: "Входно фоайе",
      type: "regular",
      chair: "",
      secretary: "",
      postponed: false,
      status: "scheduled",
      attendance: {},
      agenda: [],
    };
    setMeetings((ms) => [m, ...ms]);
    setOpenId(id);
  };

  if (open) return <MeetingDetail meeting={open} onBack={() => setOpenId(null)} onChange={(fn) => update(open.id, fn)} />;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{l(BUILDING.address)}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{l("Общи събрания", "General assemblies")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {l("Дневен ред, кворум, гласуване и протокол по ЗУЕС", "Agenda, quorum, voting and minutes under the Condominium Act")}
          </p>
        </div>
        <Button onClick={createMeeting}>
          <Plus /> {l("Насрочи събрание", "Schedule assembly")}
        </Button>
      </div>

      <div className="mt-6 grid gap-3">
        {meetings.map((m) => (
          <button
            key={m.id}
            onClick={() => setOpenId(m.id)}
            className="flex flex-col gap-2 rounded-3xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-base font-bold">
                <CalendarDays className="size-4 text-primary" />
                {fmtDate(m.date)} • {m.time}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {m.place}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {m.agenda.length} {l("точки в дневния ред", "agenda items")}
              </p>
            </div>
            <StatusBadge status={m.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Meeting["status"] }) {
  const { l } = useLang();
  const map = {
    scheduled: { t: l("Насрочено", "Scheduled"), c: "bg-accent text-accent-foreground" },
    in_progress: { t: l("В ход", "In progress"), c: "bg-warning/20 text-warning-foreground dark:text-warning" },
    finalized: { t: l("Протокол финализиран", "Minutes finalised"), c: "bg-success/15 text-success" },
  }[status];
  return <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-bold", map.c)}>{map.t}</span>;
}

function MeetingDetail({ meeting: m, onBack, onChange }: { meeting: Meeting; onBack: () => void; onChange: (fn: (m: Meeting) => Meeting) => void }) {
  const { l } = useLang();
  const locked = m.status === "finalized";
  const represented = representedParts(UNITS, m.attendance);
  const quorum = hasQuorum(represented, m.postponed);

  const finalize = () => {
    if (!quorum) {
      toast.error(l("Няма кворум – протоколът не може да бъде финализиран.", "No quorum – minutes cannot be finalised."));
      return;
    }
    if (!m.chair || !m.secretary) {
      toast.error(l("Посочете председател и протоколчик.", "Set chair and secretary."));
      return;
    }
    onChange((x) => ({ ...x, status: "finalized", finalizedAt: new Date().toISOString().slice(0, 10) }));
    toast.success(l("Протоколът е финализиран.", "Minutes finalised."));
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
      <div className="print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> {l("Всички събрания", "All assemblies")}
        </Button>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">
            {l("Общо събрание", "General assembly")} {fmtDate(m.date)}
          </h1>
          <StatusBadge status={m.status} />
        </div>

        <div className={cn("mt-4 flex items-center gap-3 rounded-2xl p-3 text-sm font-semibold", quorum ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive")}>
          <Users className="size-4" />
          {l("Представени", "Represented")}: {represented.toFixed(2)}% {l("ид. ч.", "parts")} —{" "}
          {quorum ? l("има кворум", "quorum met") : l(`няма кворум (нужни ${m.postponed ? QUORUM_POSTPONED : QUORUM_FIRST}%)`, `no quorum (need ${m.postponed ? QUORUM_POSTPONED : QUORUM_FIRST}%)`)}
        </div>
      </div>

      <Tabs defaultValue={locked ? "minutes" : "details"} className="mt-4">
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto print:hidden">
          <TabsTrigger value="details">{l("Данни", "Details")}</TabsTrigger>
          <TabsTrigger value="agenda">{l("Дневен ред", "Agenda")}</TabsTrigger>
          <TabsTrigger value="attendance">{l("Присъствие", "Attendance")}</TabsTrigger>
          <TabsTrigger value="voting">{l("Гласуване", "Voting")}</TabsTrigger>
          <TabsTrigger value="minutes">{l("Протокол", "Minutes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="print:hidden">
          <DetailsTab m={m} locked={locked} onChange={onChange} />
        </TabsContent>
        <TabsContent value="agenda" className="print:hidden">
          <AgendaTab m={m} locked={locked} onChange={onChange} />
        </TabsContent>
        <TabsContent value="attendance" className="print:hidden">
          <AttendanceTab m={m} locked={locked} onChange={onChange} />
        </TabsContent>
        <TabsContent value="voting" className="print:hidden">
          <VotingTab m={m} locked={locked} represented={represented} onChange={onChange} />
        </TabsContent>
        <TabsContent value="minutes">
          <div className="mb-3 flex flex-wrap gap-2 print:hidden">
            {!locked && (
              <Button onClick={finalize}>
                <FileSignature /> {l("Финализирай протокола", "Finalise minutes")}
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer /> {l("Принтирай за подпис", "Print for signing")}
            </Button>
          </div>
          <Minutes m={m} represented={represented} quorum={quorum} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type TabProps = { m: Meeting; locked: boolean; onChange: (fn: (m: Meeting) => Meeting) => void };

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5", className)}>{children}</div>;
}

function DetailsTab({ m, locked, onChange }: TabProps) {
  const { l } = useLang();
  const set = (k: keyof Meeting) => (e: React.ChangeEvent<HTMLInputElement>) => onChange((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Card className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label>{l("Дата", "Date")}</Label><Input type="date" value={m.date} onChange={set("date")} disabled={locked} /></div>
      <div className="grid gap-1.5"><Label>{l("Час", "Time")}</Label><Input type="time" value={m.time} onChange={set("time")} disabled={locked} /></div>
      <div className="grid gap-1.5 sm:col-span-2"><Label>{l("Място", "Place")}</Label><Input value={m.place} onChange={set("place")} disabled={locked} /></div>
      <div className="grid gap-1.5"><Label>{l("Председател на събранието", "Chair")}</Label><Input value={m.chair} onChange={set("chair")} disabled={locked} /></div>
      <div className="grid gap-1.5"><Label>{l("Протоколчик", "Secretary")}</Label><Input value={m.secretary} onChange={set("secretary")} disabled={locked} /></div>
      <div className="grid gap-1.5">
        <Label>{l("Вид", "Type")}</Label>
        <Select value={m.type} onValueChange={(v) => onChange((x) => ({ ...x, type: v as Meeting["type"] }))} disabled={locked}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">{l("Редовно", "Regular")}</SelectItem>
            <SelectItem value="extraordinary">{l("Извънредно", "Extraordinary")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3 text-sm">
        <span>{l("Отложено с 1 час (кворум 51%)", "Postponed 1 hour (51% quorum)")}</span>
        <Switch checked={m.postponed} onCheckedChange={(c) => onChange((x) => ({ ...x, postponed: c }))} disabled={locked} />
      </label>
    </Card>
  );
}

function AgendaTab({ m, locked, onChange }: TabProps) {
  const { l } = useLang();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [maj, setMaj] = useState<Majority>("simple");
  const add = () => {
    if (!title.trim()) return;
    const item: AgendaItem = { id: `i-${Date.now()}`, title: title.trim(), description: desc.trim(), majority: maj, discussion: "", votes: {} };
    onChange((x) => ({ ...x, agenda: [...x.agenda, item] }));
    setTitle("");
    setDesc("");
  };
  return (
    <div className="grid gap-3">
      {m.agenda.map((a, i) => (
        <Card key={a.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{l("Точка", "Item")} {i + 1}. {a.title}</p>
              {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              <Badge variant="secondary" className="mt-2">{l(MAJORITY_LABEL[a.majority])}</Badge>
            </div>
            {!locked && (
              <Button variant="ghost" size="icon" aria-label={l("Премахни", "Remove")} onClick={() => onChange((x) => ({ ...x, agenda: x.agenda.filter((y) => y.id !== a.id) }))}>
                <Trash2 />
              </Button>
            )}
          </div>
        </Card>
      ))}
      {!locked && (
        <Card className="grid gap-3">
          <p className="font-bold">{l("Нова точка", "New item")}</p>
          <Input placeholder={l("Заглавие", "Title")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder={l("Описание / предложение за решение", "Description / proposed resolution")} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Select value={maj} onValueChange={(v) => setMaj(v as Majority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(MAJORITY_LABEL) as Majority[]).map((k) => (
                <SelectItem key={k} value={k}>{l(MAJORITY_LABEL[k])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add} className="w-fit"><Plus /> {l("Добави точка", "Add item")}</Button>
        </Card>
      )}
    </div>
  );
}

function AttendanceTab({ m, locked, onChange }: TabProps) {
  const { l } = useLang();
  const opts: Array<{ v: Attendance; t: string }> = [
    { v: "present", t: l("Лично", "In person") },
    { v: "proxy", t: l("Пълномощно", "Proxy") },
    { v: "absent", t: l("Отсъства", "Absent") },
  ];
  return (
    <Card className="divide-y divide-border p-0 sm:p-0">
      {UNITS.map((u) => (
        <div key={u.no} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-semibold">{l("Ап.", "Apt")} {u.no} — {l(u.owner)}</p>
            <p className="text-xs text-muted-foreground">{u.idealParts}% {l("ид. ч.", "parts")}</p>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
            {opts.map((o) => {
              const active = (m.attendance[u.no] ?? "absent") === o.v;
              return (
                <button
                  key={o.v}
                  disabled={locked}
                  onClick={() => onChange((x) => ({ ...x, attendance: { ...x.attendance, [u.no]: o.v } }))}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", active ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
                >
                  {o.t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </Card>
  );
}

function VotingTab({ m, locked, represented, onChange }: TabProps & { represented: number }) {
  const { l } = useLang();
  const present = UNITS.filter((u) => m.attendance[u.no] && m.attendance[u.no] !== "absent");
  const setItem = (id: string, fn: (a: AgendaItem) => AgendaItem) => onChange((x) => ({ ...x, agenda: x.agenda.map((a) => (a.id === id ? fn(a) : a)) }));
  const voteOpts: Array<{ v: Vote; t: string }> = [
    { v: "for", t: l("За", "For") },
    { v: "against", t: l("Против", "Against") },
    { v: "abstain", t: l("Въздържал се", "Abstain") },
  ];

  if (!present.length) return <Card><p className="text-sm text-muted-foreground">{l("Първо отбележете присъстващите.", "Mark attendance first.")}</p></Card>;

  return (
    <div className="grid gap-4">
      {m.agenda.map((a, i) => {
        const t = tally(UNITS, m.attendance, a.votes);
        const adopted = isAdopted(a.majority, t, represented, UNITS);
        return (
          <Card key={a.id} className="grid gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-bold">{i + 1}. {a.title}</p>
                <p className="text-xs text-muted-foreground">{l(MAJORITY_LABEL[a.majority])}</p>
              </div>
              <ResultPill adopted={adopted} />
            </div>
            <Textarea placeholder={l("Разисквания по точката", "Discussion notes")} value={a.discussion} disabled={locked} onChange={(e) => setItem(a.id, (x) => ({ ...x, discussion: e.target.value }))} />
            <div className="grid gap-1.5">
              {present.map((u) => (
                <div key={u.no} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{l("Ап.", "Apt")} {u.no} <span className="text-xs text-muted-foreground">({u.idealParts}%)</span></span>
                  <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
                    {voteOpts.map((o) => (
                      <button
                        key={o.v}
                        disabled={locked}
                        onClick={() => setItem(a.id, (x) => ({ ...x, votes: { ...x.votes, [u.no]: o.v } }))}
                        className={cn("rounded-full px-2 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs", a.votes[u.no] === o.v ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm tabular">
              {l("За", "For")}: {t.for.toFixed(2)}% ({t.forCount}) • {l("Против", "Against")}: {t.against.toFixed(2)}% ({t.againstCount}) • {l("Въздържал се", "Abstain")}: {t.abstain.toFixed(2)}% ({t.abstainCount})
            </p>
          </Card>
        );
      })}
    </div>
  );
}

function ResultPill({ adopted }: { adopted: boolean }) {
  const { l } = useLang();
  return adopted ? (
    <span className="flex w-fit items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success"><CheckCircle2 className="size-3.5" />{l("Прието", "Adopted")}</span>
  ) : (
    <span className="flex w-fit items-center gap-1 rounded-full bg-destructive/12 px-3 py-1 text-xs font-bold text-destructive"><XCircle className="size-3.5" />{l("Неприето", "Not adopted")}</span>
  );
}

function Minutes({ m, represented, quorum }: { m: Meeting; represented: number; quorum: boolean }) {
  const presentList = useMemo(() => UNITS.filter((u) => m.attendance[u.no] && m.attendance[u.no] !== "absent"), [m.attendance]);
  return (
    <article className="rounded-3xl border border-border bg-card p-6 text-sm leading-relaxed shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
      <header className="text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Етажна собственост • {BUILDING.address.bg}, гр. {BUILDING.city.bg}</p>
        <h2 className="mt-3 flex items-center justify-center gap-2 text-xl font-bold"><Gavel className="size-5 print:hidden" />ПРОТОКОЛ</h2>
        <p className="mt-1 font-semibold">от {m.type === "regular" ? "редовно" : "извънредно"} Общо събрание на собствениците</p>
        <p className="text-muted-foreground">проведено на {fmtDate(m.date)} г. от {m.time} ч., {m.place}</p>
      </header>

      <section className="mt-6">
        <p>
          Събранието се откри от председателя <b>{m.chair || "………………"}</b>. За протоколчик е избран(а) <b>{m.secretary || "………………"}</b>.
          {m.postponed && " Поради липса на кворум в обявения час събранието бе отложено с един час съгласно чл. 15, ал. 2 от ЗУЕС."}
        </p>
        <p className="mt-2">
          Присъстват лично или чрез представител собственици на <b>{presentList.length}</b> самостоятелни обекта, притежаващи <b>{represented.toFixed(2)}%</b> идеални части от общите части.{" "}
          {quorum ? "Налице е кворум съгласно чл. 15 от ЗУЕС и събранието е законно." : "Няма кворум съгласно чл. 15 от ЗУЕС."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Присъстващи: {presentList.map((u) => `ап. ${u.no} – ${u.owner.bg}${m.attendance[u.no] === "proxy" ? " (пълномощно)" : ""}`).join("; ") || "—"}
        </p>
      </section>

      <section className="mt-6">
        <h3 className="font-bold">Дневен ред</h3>
        <ol className="mt-1 list-decimal pl-5">{m.agenda.map((a) => <li key={a.id}>{a.title}</li>)}</ol>
      </section>

      {m.agenda.map((a, i) => {
        const t = tally(UNITS, m.attendance, a.votes);
        const adopted = isAdopted(a.majority, t, represented, UNITS);
        return (
          <section key={a.id} className="mt-5 break-inside-avoid">
            <h3 className="font-bold">По точка {i + 1}: {a.title}</h3>
            {a.description && <p className="mt-1">{a.description}</p>}
            <p className="mt-1"><i>Разисквания:</i> {a.discussion || "Няма постъпили изказвания."}</p>
            <p className="mt-1">
              <i>Гласуване:</i> „За“ – {t.for.toFixed(2)}% ид. ч. ({t.forCount}); „Против“ – {t.against.toFixed(2)}% ({t.againstCount}); „Въздържал се“ – {t.abstain.toFixed(2)}% ({t.abstainCount}).
            </p>
            <p className="mt-1 font-semibold">Решение: {adopted ? "ПРИЕМА СЕ" : "НЕ СЕ ПРИЕМА"} ({MAJORITY_LABEL[a.majority].bg}).</p>
          </section>
        );
      })}

      <p className="mt-6">Поради изчерпване на дневния ред събранието бе закрито. Протоколът се поставя на видно място във входа в 7-дневен срок (чл. 16, ал. 6 от ЗУЕС).</p>

      <footer className="mt-12 grid grid-cols-2 gap-8">
        <div><div className="border-t border-foreground pt-1">Председател: {m.chair}</div></div>
        <div><div className="border-t border-foreground pt-1">Протоколчик: {m.secretary}</div></div>
      </footer>
      {m.finalizedAt && <p className="mt-6 text-xs text-muted-foreground">Електронно финализиран на {fmtDate(m.finalizedAt)} г. в VhodArena.eu</p>}
    </article>
  );
}
