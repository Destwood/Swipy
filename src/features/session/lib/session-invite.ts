import { normalizeCode } from "@/features/session/lib/session-context";

export function buildLobbyInviteUrl(
  code: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  return `${origin}/session/lobby/${encodeURIComponent(normalizeCode(code))}`;
}
