import { generateSessionCode } from "@/features/session/lib/session-context";

const SESSION_CREATE_DECK_KEY = "swipy.sessionCreateDeckId";
const SESSION_CREATE_CODE_KEY = "swipy.sessionCreateCode";

export function getSessionCreateDeckId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_CREATE_DECK_KEY);
  } catch {
    return null;
  }
}

export function setSessionCreateDeckId(id: string) {
  sessionStorage.setItem(SESSION_CREATE_DECK_KEY, id);
}

export function clearSessionCreateDeckId() {
  sessionStorage.removeItem(SESSION_CREATE_DECK_KEY);
}

export function getOrCreateSessionCreateCode(): string {
  if (typeof window === "undefined") return "SWPY-····";
  try {
    const existing = sessionStorage.getItem(SESSION_CREATE_CODE_KEY);
    if (existing) return existing;
    return regenerateSessionCreateCode();
  } catch {
    return generateSessionCode();
  }
}

export function regenerateSessionCreateCode(): string {
  const code = generateSessionCode();
  try {
    sessionStorage.setItem(SESSION_CREATE_CODE_KEY, code);
  } catch {
    /* ignore */
  }
  return code;
}

export function clearSessionCreateCode() {
  try {
    sessionStorage.removeItem(SESSION_CREATE_CODE_KEY);
  } catch {
    /* ignore */
  }
}
