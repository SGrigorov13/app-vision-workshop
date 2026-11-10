import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CheckCircle2, KeyRound, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { decodeInvite, ROLE_HOME, ROLE_LABEL } from "@/lib/invitations";
import { usePlatform } from "@/lib/platform-store";

export const Route = createFileRoute("/pokana/$token")({
  head: () => ({
    meta: [
      { title: "Покана за регистрация — VhodArena.eu" },
      { name: "description", content: "Завършете регистрацията си в етажната собственост във VhodArena.eu." },
      { property: "og:title", content: "Покана за регистрация — VhodArena.eu" },
      { property: "og:description", content: "Завършете регистрацията си в етажната собственост." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { l } = useLang();
  const { acceptInvite, condos, setActiveId } = usePlatform();
  const inv = decodeInvite(token);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);

  if (!inv)
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-3 text-xl font-bold">{l("Невалидна покана", "Invalid invitation")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{l("Помолете администратора да изпрати нов QR код.", "Ask the admin to send a new QR code.")}</p>
      </div>
    );

  const roles = inv.r.map((r) => l(ROLE_LABEL[r])).join(" + ");
  const home = ROLE_HOME[inv.r[0] ?? "resident"];

  const submit = () => {
    if (pw.length < 8) return toast.error(l("Паролата трябва да е поне 8 символа", "Password must be at least 8 characters"));
    if (pw !== pw2) return toast.error(l("Паролите не съвпадат", "Passwords do not match"));
    acceptInvite(inv.i);
    const condoId = inv.i.split(":")[0];
    if (condos.some((c) => c.id === condoId)) setActiveId(condoId!);
    setDone(true);
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Building2 className="size-6" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{l("Покана за регистрация", "Registration invite")}</p>
        <h1 className="mt-1 text-xl font-bold">{inv.c}</h1>
        <p className="text-sm text-muted-foreground">{inv.a}</p>
        <div className="mt-4 rounded-2xl bg-accent/60 p-3 text-sm">
          <p>
            {l("Здравейте", "Hello")}, <b>{inv.n}</b>
          </p>
          <p className="mt-1">
            {l("Роля", "Role")}: <b>{roles}</b>
            {inv.ap ? ` · ${l("ап.", "apt.")} ${inv.ap}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">{inv.e}</p>
        </div>

        {done ? (
          <div className="mt-5 text-center">
            <CheckCircle2 className="mx-auto size-10 text-success" />
            <p className="mt-2 font-bold">{l("Регистрацията е завършена", "You're registered")}</p>
            <Button asChild className="mt-4 w-full">
              <Link to={home}>{l("Към моя раздел", "Go to my section")}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pw">{l("Създайте парола", "Create a password")}</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pw2">{l("Повторете паролата", "Repeat password")}</Label>
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submit}>
              <KeyRound /> {l("Завърши регистрацията", "Finish registration")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
