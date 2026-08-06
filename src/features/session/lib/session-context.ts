import type { Database } from "@/shared/supabase/database.types";
import type { SessionMember } from "@/features/session/data/session";

export type DbSession = Database["public"]["Tables"]["sessions"]["Row"];
export type DbMember = Database["public"]["Tables"]["session_members"]["Row"];
export type DbVote = Database["public"]["Tables"]["votes"]["Row"];

const ACTIVE_SESSION_KEY = "swipy.activeSession";
const MEMBERSHIPS_KEY = "swipy.membershipsByCode";

export type ActiveSession = {
  sessionId: string;
  memberId: string;
  code: string;
  deckId: string;
  isHost: boolean;
  displayName: string;
  guestToken: string;
};

type StoredMembership = {
  sessionId: string;
  memberId: string;
  guestToken: string;
  displayName: string;
  isHost: boolean;
};

function readMemberships(): Record<string, StoredMembership> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEMBERSHIPS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredMembership>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMemberships(map: Record<string, StoredMembership>) {
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(map));
}

/** Fresh token every membership — works even if DB still has global unique on guest_token. */
export function createGuestToken(): string {
  return crypto.randomUUID();
}

export function getMembershipByCode(code: string): StoredMembership | null {
  const key = normalizeCode(code);
  return readMemberships()[key] ?? null;
}

export function saveMembership(code: string, membership: StoredMembership) {
  const map = readMemberships();
  map[normalizeCode(code)] = membership;
  writeMemberships(map);
}

export function setActiveSession(session: ActiveSession) {
  sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  saveMembership(session.code, {
    sessionId: session.sessionId,
    memberId: session.memberId,
    guestToken: session.guestToken,
    displayName: session.displayName,
    isHost: session.isHost,
  });
}

export function getActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSession;
  } catch {
    return null;
  }
}

export function clearActiveSession() {
  sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function generateSessionCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SWPY-${suffix}`;
}

const COLORS = ["#2dd4bf", "#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa"];

function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * 17) % COLORS.length;
  return COLORS[hash] ?? COLORS[0];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function toUiMember(member: DbMember): SessionMember {
  return {
    id: member.id,
    name: member.display_name,
    initials: initialsFromName(member.display_name),
    role: member.is_host ? "host" : "member",
    status: member.status as SessionMember["status"],
    color: colorFromId(member.id),
  };
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
