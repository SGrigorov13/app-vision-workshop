import { Link } from "@tanstack/react-router";
import { CheckCircle2, Copy, Download, ExternalLink, Mail, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRef } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { ROLE_LABEL, type Invite } from "@/lib/invitations";
import { makeInviteUrl } from "@/lib/platform-store";

export function InviteCard({ invite, condoName }: { invite: Invite; condoName: string }) {
  const { l } = useLang();
  const qrRef = useRef<HTMLDivElement>(null);
  const url = makeInviteUrl(invite.token);
  const roles = invite.roles.map((r) => l(ROLE_LABEL[r])).join(" + ");

  const download = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const style = getComputedStyle(qrRef.current!);
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll("path").forEach((p, i) => p.setAttribute("fill", i === 0 ? style.backgroundColor : style.color));
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pokana-${invite.name.replace(/\s+/g, "-") || invite.id}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const subject = l(`Покана за регистрация – ${condoName}`, `Registration invite – ${condoName}`);
  const body = l(
    `Здравейте, ${invite.name}!\n\nПоканени сте като ${roles} в ${condoName} във VhodArena.eu.\nСканирайте QR кода или отворете връзката, за да завършите регистрацията:\n${url}`,
    `Hello ${invite.name},\n\nYou are invited as ${roles} of ${condoName} on VhodArena.eu.\nScan the QR code or open the link to finish registering:\n${url}`,
  );

  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
      <div ref={qrRef} className="shrink-0 self-start rounded-xl bg-qr p-2 text-qr-foreground">
        <QRCodeSVG value={url} size={96} fgColor="currentColor" bgColor="transparent" level="M" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{invite.name}</p>
            <p className="truncate text-xs text-muted-foreground">{invite.email}</p>
          </div>
          {invite.status === "accepted" ? (
            <Badge variant="success" className="shrink-0">
              <CheckCircle2 className="size-3" /> {l("Регистриран", "Joined")}
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0">
              <Send className="size-3" /> {l("Изпратена", "Sent")}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs font-semibold text-primary">
          {roles}
          {invite.apartment ? ` · ${l("ап.", "apt.")} ${invite.apartment}` : ""}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {l("Изпратена на", "Sent on")} {invite.sentAt}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
            onClick={() => {
              void navigator.clipboard?.writeText(url);
              toast.success(l("Връзката е копирана", "Link copied"));
            }}
          >
            <Copy className="size-3.5" /> {l("Връзка", "Link")}
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={download}>
            <Download className="size-3.5" /> QR
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" asChild>
            <a href={`mailto:${invite.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>
              <Mail className="size-3.5" /> {l("Имейл", "Email")}
            </a>
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" asChild>
            <Link to="/pokana/$token" params={{ token: invite.token }}>
              <ExternalLink className="size-3.5" /> {l("Отвори", "Open")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
