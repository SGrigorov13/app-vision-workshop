import { Building2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { validateCondo, type Condo } from "@/lib/treasury";

const EMPTY: Condo = {
  name: "", address: "", city: "", postcode: "", bulstat: "", floors: 1, units: 1,
  iban: "", bic: "", manager: "", cashier: "", board: "", mandateUntil: "",
};

export function CondoRegistration() {
  const { l } = useLang();
  const [c, setC] = useState<Condo>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [registered, setRegistered] = useState<Condo[]>([]);
  const set = <K extends keyof Condo>(k: K, v: Condo[K]) => setC((s) => ({ ...s, [k]: v }));

  const submit = () => {
    const e = validateCondo(c);
    setErrors(e);
    if (e.length) return toast.error(l("Проверете отбелязаните полета", "Check the highlighted fields"));
    setRegistered((r) => [...r, c]);
    setC(EMPTY);
    toast.success(l("Етажната собственост е регистрирана", "Condominium registered"));
  };

  const F = ({ k, label, type = "text", span }: { k: keyof Condo; label: string; type?: string; span?: boolean }) => (
    <div className={span ? "space-y-1 sm:col-span-2" : "space-y-1"}>
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={type}
        value={String(c[k])}
        aria-invalid={errors.includes(k)}
        className={errors.includes(k) ? "border-destructive" : ""}
        onChange={(e) => set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{l("Регистрация на етажна собственост", "Register a condominium")}</h1>
        <p className="text-sm text-muted-foreground">
          {l("Админ панел — данни на сградата, банкова сметка и органи на управление.", "Admin — building details, bank account and management bodies.")}
        </p>
      </div>

      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="font-semibold sm:col-span-2">{l("Сграда", "Building")}</h2>
        {F({ k: "name", label: l("Наименование *", "Name *"), span: true })}
        {F({ k: "address", label: l("Адрес *", "Address *"), span: true })}
        {F({ k: "city", label: l("Град", "City") })}
        {F({ k: "postcode", label: l("Пощенски код", "Postcode") })}
        {F({ k: "bulstat", label: l("БУЛСТАТ", "BULSTAT") })}
        {F({ k: "floors", label: l("Етажи", "Floors"), type: "number" })}
        {F({ k: "units", label: l("Брой самостоятелни обекти *", "Units *"), type: "number" })}
      </section>

      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="font-semibold sm:col-span-2">{l("Банкова сметка", "Bank account")}</h2>
        {F({ k: "iban", label: "IBAN" })}
        {F({ k: "bic", label: "BIC" })}
      </section>

      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 sm:p-6">
        <h2 className="font-semibold sm:col-span-2">{l("Органи на управление", "Management")}</h2>
        {F({ k: "manager", label: l("Домоуправител *", "Manager *") })}
        {F({ k: "cashier", label: l("Касиер", "Cashier") })}
        {F({ k: "board", label: l("Контролен съвет (имена)", "Supervisory board (names)"), span: true })}
        {F({ k: "mandateUntil", label: l("Мандат до", "Mandate until"), type: "date" })}
      </section>

      <Button className="w-full sm:w-auto" onClick={submit}>{l("Регистрирай", "Register")}</Button>

      {registered.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">{l("Регистрирани", "Registered")}</h2>
          {registered.map((r, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
              <Building2 className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.address} · {r.units} {l("обекта", "units")}</p>
              </div>
              <CheckCircle2 className="size-5 text-success" />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
