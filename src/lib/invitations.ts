import type { L } from "./i18n";

export type InviteRole = "manager" | "cashier" | "board" | "resident";

export const ROLE_LABEL: Record<InviteRole, L> = {
  manager: { bg: "Домоуправител", en: "Manager" },
  cashier: { bg: "Касиер", en: "Cashier" },
  board: { bg: "Член на Контролен съвет", en: "Board member" },
  resident: { bg: "Живущ", en: "Resident" },
};

/** Section each role lands in after accepting the invitation. */
export const ROLE_HOME: Record<InviteRole, "/" | "/domoupravitel" | "/kontrolen-savet" | "/kasi"> = {
  manager: "/domoupravitel",
  cashier: "/kasi",
  board: "/kontrolen-savet",
  resident: "/",
};

export type Person = { id: string; name: string; email: string };
export type ResidentPerson = Person & { apartment: string };

export type People = {
  manager: Person;
  cashierSameAsManager: boolean;
  cashier: Person;
  board: Person[];
  residents: ResidentPerson[];
};

export type Invite = {
  id: string;
  roles: InviteRole[];
  name: string;
  email: string;
  apartment?: string | undefined;
  token: string;
  status: "sent" | "accepted";
  sentAt: string;
};

export type InvitePayload = { c: string; a: string; r: InviteRole[]; n: string; e: string; ap?: string | undefined; i: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (s: string) => EMAIL_RE.test(s.trim());

/** Field keys with errors, e.g. "manager.email", "board.0.name", "residents". */
export function validatePeople(p: People): string[] {
  const errs: string[] = [];
  const check = (prefix: string, x: Person) => {
    if (!x.name.trim()) errs.push(`${prefix}.name`);
    if (!isEmail(x.email)) errs.push(`${prefix}.email`);
  };
  check("manager", p.manager);
  if (!p.cashierSameAsManager) check("cashier", p.cashier);
  if (p.board.length < 1) errs.push("board");
  p.board.forEach((b, i) => check(`board.${i}`, b));
  if (p.residents.length < 1) errs.push("residents");
  p.residents.forEach((r, i) => {
    check(`residents.${i}`, r);
    if (!r.apartment.trim()) errs.push(`residents.${i}.apartment`);
  });
  return errs;
}

/** One invite per person and role; a cashier who is also the manager gets a single combined invite. */
export function buildInvites(p: People, makeToken: (x: Omit<Invite, "token" | "status" | "sentAt">) => string, sentAt: string): Invite[] {
  const list: Array<Omit<Invite, "token" | "status" | "sentAt">> = [];
  list.push({ id: p.manager.id, roles: p.cashierSameAsManager ? ["manager", "cashier"] : ["manager"], name: p.manager.name.trim(), email: p.manager.email.trim() });
  if (!p.cashierSameAsManager) list.push({ id: p.cashier.id, roles: ["cashier"], name: p.cashier.name.trim(), email: p.cashier.email.trim() });
  for (const b of p.board) list.push({ id: b.id, roles: ["board"], name: b.name.trim(), email: b.email.trim() });
  for (const r of p.residents) list.push({ id: r.id, roles: ["resident"], name: r.name.trim(), email: r.email.trim(), apartment: r.apartment.trim() });
  return list.map((x) => ({ ...x, token: makeToken(x), status: "sent", sentAt }));
}

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeInvite(p: InvitePayload): string {
  return toB64Url(JSON.stringify(p));
}

export function decodeInvite(token: string): InvitePayload | null {
  try {
    const p = JSON.parse(fromB64Url(token)) as InvitePayload;
    if (!p || typeof p.c !== "string" || !Array.isArray(p.r) || typeof p.e !== "string") return null;
    return p;
  } catch {
    return null;
  }
}
