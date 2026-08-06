import type { Game } from "@/features/games/data/games";

export const SHARE_MATCHES_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type ShareMatchesPayload = {
  v: 1;
  ids: string[];
  likes: Record<string, number>;
  members: number;
  exp: number;
};

function toBase64Url(bytes: string): string {
  const b64 =
    typeof window !== "undefined"
      ? btoa(bytes)
      : Buffer.from(bytes, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const b64 = padded + pad;
  if (typeof window !== "undefined") return atob(b64);
  return Buffer.from(b64, "base64").toString("binary");
}

export function buildShareMatchesPayload(input: {
  matches: Game[];
  likeCounts: Record<string, number>;
  memberCount: number;
  now?: number;
}): ShareMatchesPayload {
  const now = input.now ?? Date.now();
  const likes: Record<string, number> = {};
  for (const game of input.matches) {
    likes[game.id] = input.likeCounts[game.id] ?? 0;
  }
  return {
    v: 1,
    ids: input.matches.map((g) => g.id),
    likes,
    members: input.memberCount,
    exp: now + SHARE_MATCHES_TTL_MS,
  };
}

export function encodeShareMatchesToken(payload: ShareMatchesPayload): string {
  return toBase64Url(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeShareMatchesToken(token: string): ShareMatchesPayload | null {
  try {
    const json = decodeURIComponent(escape(fromBase64Url(token)));
    const data = JSON.parse(json) as ShareMatchesPayload;
    if (data?.v !== 1 || !Array.isArray(data.ids) || typeof data.exp !== "number") {
      return null;
    }
    if (!data.ids.every((id) => typeof id === "string" && id.length > 0)) {
      return null;
    }
    return {
      v: 1,
      ids: data.ids.slice(0, 48),
      likes: data.likes && typeof data.likes === "object" ? data.likes : {},
      members: typeof data.members === "number" ? data.members : 0,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export function isShareMatchesExpired(payload: ShareMatchesPayload, now = Date.now()): boolean {
  return now > payload.exp;
}

export function buildShareMatchesUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/share/matches?d=${encodeURIComponent(token)}`;
}

export function formatShareExpiry(exp: number): string {
  return new Date(exp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
